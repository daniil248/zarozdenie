"""
Мульти-стратегийный движок сигналов.

Автоматически определяет режим рынка и применяет подходящую стратегию:
  1. TREND (ADX > 20)   → Pullback: вход на откате к EMA21 по тренду
  2. RANGE (ADX < 20)   → Mean Reversion: отбой от BB bands, RSI экстремумы
  3. SQUEEZE (BB узкие)  → Breakout: пробой после сжатия волатильности

Принцип: рынок всегда в одном из трёх состояний. Одна стратегия не может
работать везде. Когда pullback сливает — значит тренда нет, и бот переключается
на mean reversion. Не останавливаемся, а адаптируемся.
"""
import logging
from dataclasses import dataclass
from decimal import Decimal
from enum import Enum
from typing import Optional

from backend.analysis.indicators import MarketState
from backend.analysis.market_structure import MarketStructure, compute_structural_sl_tp
from backend.analysis.candle_patterns import CandleSignal

logger = logging.getLogger(__name__)


class SignalAction(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class MarketRegime(str, Enum):
    TREND = "trend"
    RANGE = "range"
    SQUEEZE = "squeeze"
    UNKNOWN = "unknown"


@dataclass
class TradeSignal:
    """Результат анализа сигнального движка."""
    action: SignalAction
    confidence: float      # 0.0 - 1.0
    reason: str            # краткое описание
    sl_points: Decimal     # SL в единицах цены
    tp_points: Decimal     # TP в единицах цены
    regime: str = "unknown"  # какой режим рынка определён


# ─── Настройки ──────────────────────────────────────────────────────
MAX_TRADES_PER_DAY = 10
LOSS_PAUSE_THRESHOLD = 3

# SL/TP пределы для FX — ШИРОКИЙ SL, цена дышит, шум не выбивает
# При 0.05 лот: SL 30 pip = $15 убыток = 0.22% от $6800
FX_SL_PIPS = Decimal("0.00300")   # 30 пипсов дефолт
FX_TP_PIPS = Decimal("0.00400")   # 40 пипсов TP
FX_MIN_SL = Decimal("0.00200")    # 20 пипсов минимум
FX_MAX_SL = Decimal("0.00400")    # 40 пипсов максимум

# Mean Reversion
MR_SL_PIPS = Decimal("0.00200")   # 20 пипсов SL
MR_TP_PIPS = Decimal("0.00250")   # 25 пипсов TP

# Breakout: широкий TP (ловим импульс)
BO_SL_PIPS = Decimal("0.00300")   # 30 пипсов SL
BO_TP_PIPS = Decimal("0.00500")   # 50 пипсов TP (R:R = 1:1.7)

# BTC/USD: свинг-трейдинг (не скальпинг!)
BTC_SL = Decimal("200")           # $200 SL
BTC_TP = Decimal("300")           # $300 TP (R:R 1:1.5)
BTC_MIN_SL = Decimal("100")       # $100 мин
BTC_MAX_SL = Decimal("500")       # $500 макс
BTC_COMMISSION = Decimal("20")    # ~$20 спред+комиссия CFD

FX_VOLUME_SPIKE_THRESHOLD = 5.0

# Комиссия в единицах цены (~2 пипса round-trip для FX)
# Используется для гарантии R:R >= 1:1 после комиссии
COMMISSION_POINTS = Decimal("0.00020")

# Пороги входа — СТРОГИЕ, только сильные сигналы
NORMAL_MIN_SCORE = 4
AFTER_SL_SAME_DIR_MIN_SCORE = 5

# Пороги режимов
ADX_TREND_THRESHOLD = 25      # ADX > 25 = тренд (поднято с 20 для надёжности)
ADX_STRONG_THRESHOLD = 30     # ADX > 30 = сильный тренд (бонус в pullback scoring)
BB_SQUEEZE_THRESHOLD = 0.003  # BB width < 0.3% = сжатие


# ═══════════════════════════════════════════════════════════════════
# ДЕТЕКЦИЯ РЕЖИМА РЫНКА
# ═══════════════════════════════════════════════════════════════════

def detect_regime(state: MarketState) -> MarketRegime:
    """
    Определить текущий режим рынка по ADX + BB width.

    Логика:
      - BB width < 0.3% = SQUEEZE (волатильность сжата, жди пробой)
      - ADX > 20 = TREND (есть направление, торгуй откаты)
      - ADX <= 20 = RANGE (боковик, торгуй от границ)
    """
    adx = float(state.adx or 0)
    bb_width = float(state.bb_width or 0.01)

    # Trend имеет приоритет: если ADX показывает сильный тренд,
    # узкие BB = консолидация внутри тренда, не breakout
    if adx >= ADX_TREND_THRESHOLD:
        return MarketRegime.TREND

    # Squeeze: BB очень узкие при слабом ADX — волатильность сжата, жди пробой
    if 0 < bb_width < BB_SQUEEZE_THRESHOLD:
        return MarketRegime.SQUEEZE

    # Range: ADX слабый, рынок в коридоре
    if adx > 0:
        return MarketRegime.RANGE

    return MarketRegime.UNKNOWN


# ═══════════════════════════════════════════════════════════════════
# СТРАТЕГИЯ 1: PULLBACK (тренд)
# Вход на откате к EMA21 в направлении тренда
# ═══════════════════════════════════════════════════════════════════

def _signal_pullback(
    state: MarketState, state_h1: Optional[MarketState],
    trend_h4: str, adx: float, atr: float,
    session_name: str, last_sl_direction: Optional[str],
    candle_signal: Optional[CandleSignal] = None,
) -> Optional[TradeSignal]:
    price = float(state.price or 0)
    ema9 = float(state.ema_9 or 0)
    ema21 = float(state.ema_21 or 0)
    ema50 = float(state.ema_50 or 0)
    rsi = float(state.rsi or 50)
    macd_hist = float(state.macd_hist or 0)
    macd_line = float(state.macd_line or 0)
    macd_signal_val = float(state.macd_signal or 0)
    bb_lower = float(state.bb_lower or 0)
    bb_upper = float(state.bb_upper or 0)

    if not ema9 or not ema21 or not price:
        return None

    # ── BUY scoring ──
    buy_score = 0
    buy_reasons = []

    if ema9 > ema21:
        buy_score += 1
        buy_reasons.append("EMA9>21")
        if ema21 > ema50:
            buy_score += 1
            buy_reasons.append("EMA9>21>50")

    if rsi < 30:
        buy_score += 2
        buy_reasons.append("RSI={:.0f}(extreme)".format(rsi))
    elif rsi < 40:
        buy_score += 1
        buy_reasons.append("RSI={:.0f}(oversold)".format(rsi))
    elif rsi < 48:
        buy_score += 1
        buy_reasons.append("RSI={:.0f}(ok)".format(rsi))

    if macd_hist > 0:
        buy_score += 1
        buy_reasons.append("MACD+")
    elif macd_line > macd_signal_val and macd_hist > -atr * 0.05:
        buy_score += 1
        buy_reasons.append("MACD_cross")

    dist_to_ema21 = abs(price - ema21)
    # Pullback BUY: цена рядом с EMA21 (±1 ATR) — зона отката
    if dist_to_ema21 < atr * 1.5 and price >= ema50:
        buy_score += 1
        buy_reasons.append("pullback")

    if trend_h4 == "up":
        buy_score += 1
        buy_reasons.append("H4=UP")

    if bb_lower > 0 and price <= bb_lower * 1.001:
        buy_score += 1
        buy_reasons.append("BB_low")

    if adx > ADX_STRONG_THRESHOLD:
        buy_score += 1
        buy_reasons.append("ADX={:.0f}".format(adx))

    # ── SELL scoring ──
    sell_score = 0
    sell_reasons = []

    if ema9 < ema21:
        sell_score += 1
        sell_reasons.append("EMA9<21")
        if ema21 < ema50:
            sell_score += 1
            sell_reasons.append("EMA9<21<50")

    if rsi > 70:
        sell_score += 2
        sell_reasons.append("RSI={:.0f}(extreme)".format(rsi))
    elif rsi > 60:
        sell_score += 1
        sell_reasons.append("RSI={:.0f}(overbought)".format(rsi))
    elif rsi > 52:
        sell_score += 1
        sell_reasons.append("RSI={:.0f}(ok)".format(rsi))

    if macd_hist < 0:
        sell_score += 1
        sell_reasons.append("MACD-")
    elif macd_line < macd_signal_val and macd_hist < atr * 0.05:
        sell_score += 1
        sell_reasons.append("MACD_cross")

    # Pullback SELL: цена рядом с EMA21 (±1.5 ATR) — зона отката
    if dist_to_ema21 < atr * 1.5 and price <= ema50:
        sell_score += 1
        sell_reasons.append("pullback")

    if trend_h4 == "down":
        sell_score += 1
        sell_reasons.append("H4=DOWN")

    if bb_upper > 0 and price >= bb_upper * 0.999:
        sell_score += 1
        sell_reasons.append("BB_high")

    if adx > ADX_STRONG_THRESHOLD:
        sell_score += 1
        sell_reasons.append("ADX={:.0f}".format(adx))

    # ── H1 confirmation / contradiction ──
    # H1 aligned = +1 бонус. H1 противоречит = -1 штраф.
    # Без RSI-фильтра (RSI<55 был бесполезен — почти всегда true).
    if state_h1:
        h1_ema9 = float(state_h1.ema_9 or 0)
        h1_ema21 = float(state_h1.ema_21 or 0)
        if h1_ema9 and h1_ema21:
            if h1_ema9 > h1_ema21:
                buy_score += 1
                buy_reasons.append("H1_bull")
                if sell_score > 0:
                    sell_score -= 1
                    sell_reasons.append("H1_contra")
            elif h1_ema9 < h1_ema21:
                sell_score += 1
                sell_reasons.append("H1_bear")
                if buy_score > 0:
                    buy_score -= 1
                    buy_reasons.append("H1_contra")

    # H4 counter-trend penalty
    if trend_h4 == "down" and buy_score > 0:
        buy_score -= 1
    if trend_h4 == "up" and sell_score > 0:
        sell_score -= 1

    # ── Candle pattern confirmation ──
    # Pin bar / engulfing на уровне = сильнейший сигнал входа
    # Бычий паттерн ПОМОГАЕТ buy и ШТРАФУЕТ sell (и наоборот)
    if candle_signal:
        if candle_signal.bullish_score >= 2:
            buy_score += 2
            buy_reasons.append("candle({})".format(",".join(candle_signal.patterns)))
            if sell_score > 0:
                sell_score -= 1
                sell_reasons.append("candle_contra")
        elif candle_signal.bullish_score >= 1:
            buy_score += 1
            buy_reasons.append("candle_weak({})".format(",".join(candle_signal.patterns)))
        if candle_signal.bearish_score >= 2:
            sell_score += 2
            sell_reasons.append("candle({})".format(",".join(candle_signal.patterns)))
            if buy_score > 0:
                buy_score -= 1
                buy_reasons.append("candle_contra")
        elif candle_signal.bearish_score >= 1:
            sell_score += 1
            sell_reasons.append("candle_weak({})".format(",".join(candle_signal.patterns)))

    # ── Entry quality: отсекаем поздние входы ──
    # Если цена уже далеко от EMA21 (> 2 ATR), откат исчерпан — вход запоздал
    if dist_to_ema21 > atr * 2.0:
        if buy_score > 0:
            buy_score -= 1
            buy_reasons.append("late_entry")
        if sell_score > 0:
            sell_score -= 1
            sell_reasons.append("late_entry")

    # SL/TP adaptive
    sl = max(min(Decimal(str(round(atr * 2.5, 5))), FX_MAX_SL), FX_MIN_SL)
    tp = max(Decimal(str(round(atr * 3.5, 5))), sl + Decimal("0.00050"))

    # Threshold
    base_min = NORMAL_MIN_SCORE + 1 if session_name == "asian" else NORMAL_MIN_SCORE
    buy_min = AFTER_SL_SAME_DIR_MIN_SCORE if last_sl_direction and last_sl_direction.lower() == "buy" else base_min
    sell_min = AFTER_SL_SAME_DIR_MIN_SCORE if last_sl_direction and last_sl_direction.lower() == "sell" else base_min

    if buy_score >= buy_min and buy_score > sell_score:
        return TradeSignal(
            action=SignalAction.BUY, confidence=min(buy_score / 9.0, 1.0),
            reason="PULLBACK BUY [{}pt/{}]: {}".format(buy_score, buy_min, ", ".join(buy_reasons)),
            sl_points=sl, tp_points=tp, regime="trend",
        )
    if sell_score >= sell_min and sell_score > buy_score:
        return TradeSignal(
            action=SignalAction.SELL, confidence=min(sell_score / 9.0, 1.0),
            reason="PULLBACK SELL [{}pt/{}]: {}".format(sell_score, sell_min, ", ".join(sell_reasons)),
            sl_points=sl, tp_points=tp, regime="trend",
        )
    return None


# ═══════════════════════════════════════════════════════════════════
# СТРАТЕГИЯ 2: MEAN REVERSION (боковик)
# Отбой от Bollinger Bands + RSI экстремумы
# ═══════════════════════════════════════════════════════════════════

def _signal_mean_reversion(
    state: MarketState, atr: float,
    session_name: str, last_sl_direction: Optional[str],
    trend_h4: str = "side",
    candle_signal: Optional[CandleSignal] = None,
) -> Optional[TradeSignal]:
    """
    Mean reversion: покупаем у нижней BB + RSI перепродан,
    продаём у верхней BB + RSI перекуплен.

    Логика: в боковике цена ходит от одной границы BB к другой.
    SL за границей канала, TP = середина (BB middle).

    ВАЖНО: НЕ торгуем против H4 тренда — это ловля падающего ножа.
    """
    price = float(state.price or 0)
    rsi = float(state.rsi or 50)
    bb_lower = float(state.bb_lower or 0)
    bb_upper = float(state.bb_upper or 0)
    bb_middle = float(state.bb_middle or 0)
    macd_hist = float(state.macd_hist or 0)

    if not price or not bb_lower or not bb_upper or not bb_middle:
        return None

    buy_score = 0
    buy_reasons = []
    sell_score = 0
    sell_reasons = []

    # ── ANTI-TREND FILTER: не торгуем MR против H4 тренда ──
    # BUY при H4=DOWN = ловля падающего ножа. RSI<30 в сильном тренде = норма, не разворот.
    # SELL при H4=UP = вставание перед паровозом.
    h4 = trend_h4.lower() if trend_h4 else "side"
    block_buy = h4 == "down"
    block_sell = h4 == "up"

    # ── BUY: цена у нижней BB + RSI перепродан ──
    bb_range = bb_upper - bb_lower
    if bb_range > 0:
        position_in_bb = (price - bb_lower) / bb_range  # 0.0 = нижняя, 1.0 = верхняя

        if not block_buy:
            if position_in_bb <= 0.15:
                buy_score += 2
                buy_reasons.append("BB_bottom_{:.0f}%".format(position_in_bb * 100))
            elif position_in_bb <= 0.30:
                buy_score += 1
                buy_reasons.append("BB_low_{:.0f}%".format(position_in_bb * 100))

        if not block_sell:
            if position_in_bb >= 0.85:
                sell_score += 2
                sell_reasons.append("BB_top_{:.0f}%".format(position_in_bb * 100))
            elif position_in_bb >= 0.70:
                sell_score += 1
                sell_reasons.append("BB_high_{:.0f}%".format(position_in_bb * 100))

    # RSI экстремумы (mean reversion нужны сильные экстремумы)
    if not block_buy:
        if rsi < 30:
            buy_score += 2
            buy_reasons.append("RSI={:.0f}(extreme)".format(rsi))
        elif rsi < 40:
            buy_score += 1
            buy_reasons.append("RSI={:.0f}(low)".format(rsi))

    if not block_sell:
        if rsi > 70:
            sell_score += 2
            sell_reasons.append("RSI={:.0f}(extreme)".format(rsi))
        elif rsi > 60:
            sell_score += 1
            sell_reasons.append("RSI={:.0f}(high)".format(rsi))

    # MACD разворот (гистограмма меняет направление)
    if not block_buy and macd_hist > 0 and rsi < 50:
        buy_score += 1
        buy_reasons.append("MACD_turn")
    if not block_sell and macd_hist < 0 and rsi > 50:
        sell_score += 1
        sell_reasons.append("MACD_turn")

    # ── Candle pattern: разворотная свеча на границе BB = сильнейший MR сигнал ──
    # Бычий паттерн помогает buy и штрафует sell
    if candle_signal:
        if not block_buy and candle_signal.bullish_score >= 2:
            buy_score += 2
            buy_reasons.append("candle({})".format(",".join(candle_signal.patterns)))
            if not block_sell and sell_score > 0:
                sell_score -= 1
                sell_reasons.append("candle_contra")
        elif not block_buy and candle_signal.bullish_score >= 1:
            buy_score += 1
            buy_reasons.append("candle_weak")
        if not block_sell and candle_signal.bearish_score >= 2:
            sell_score += 2
            sell_reasons.append("candle({})".format(",".join(candle_signal.patterns)))
            if not block_buy and buy_score > 0:
                buy_score -= 1
                buy_reasons.append("candle_contra")
        elif not block_sell and candle_signal.bearish_score >= 1:
            sell_score += 1
            sell_reasons.append("candle_weak")

    # SL/TP для mean reversion: тесные, быстрые сделки
    # SL = за границей BB + 2 пипса запас
    # TP = до середины BB (но не менее 8 пипсов)
    dist_to_middle = abs(price - bb_middle)
    sl_mr = max(Decimal(str(round(atr * 1.2, 5))), MR_SL_PIPS)  # ATR * 1.2, минимум 8 pip
    tp_mr = max(Decimal(str(round(dist_to_middle * 0.85, 5))), MR_TP_PIPS)  # 85% до середины
    # Гарантия R:R >= 1:1 для MR
    if tp_mr < sl_mr:
        tp_mr = sl_mr

    # Порог: 3+ в обычных сессиях, 4+ в Азии
    base_min = NORMAL_MIN_SCORE + 1 if session_name == "asian" else NORMAL_MIN_SCORE
    buy_min = AFTER_SL_SAME_DIR_MIN_SCORE if last_sl_direction and last_sl_direction.lower() == "buy" else base_min
    sell_min = AFTER_SL_SAME_DIR_MIN_SCORE if last_sl_direction and last_sl_direction.lower() == "sell" else base_min

    if buy_score >= buy_min and buy_score > sell_score:
        return TradeSignal(
            action=SignalAction.BUY, confidence=min(buy_score / 6.0, 1.0),
            reason="MR BUY [{}pt/{}]: {}".format(buy_score, buy_min, ", ".join(buy_reasons)),
            sl_points=sl_mr, tp_points=tp_mr, regime="range",
        )
    if sell_score >= sell_min and sell_score > buy_score:
        return TradeSignal(
            action=SignalAction.SELL, confidence=min(sell_score / 6.0, 1.0),
            reason="MR SELL [{}pt/{}]: {}".format(sell_score, sell_min, ", ".join(sell_reasons)),
            sl_points=sl_mr, tp_points=tp_mr, regime="range",
        )
    return None


# ═══════════════════════════════════════════════════════════════════
# СТРАТЕГИЯ 3: BREAKOUT (после сжатия)
# Пробой BB после сужения + подтверждение объёмом/ADX
# ═══════════════════════════════════════════════════════════════════

def _signal_breakout(
    state: MarketState, atr: float, volume_ratio: float,
    session_name: str, last_sl_direction: Optional[str],
    candle_signal: Optional[CandleSignal] = None,
) -> Optional[TradeSignal]:
    """
    Breakout: входим когда цена пробивает BB после squeeze.

    Логика: BB сжались → волатильность скоро взорвётся → ловим пробой.
    Нужно подтверждение: volume > 1.5x, свеча закрылась за BB.
    """
    price = float(state.price or 0)
    bb_lower = float(state.bb_lower or 0)
    bb_upper = float(state.bb_upper or 0)
    rsi = float(state.rsi or 50)
    macd_hist = float(state.macd_hist or 0)
    ema9 = float(state.ema_9 or 0)
    ema21 = float(state.ema_21 or 0)

    if not price or not bb_lower or not bb_upper:
        return None

    buy_score = 0
    buy_reasons = []
    sell_score = 0
    sell_reasons = []

    # Пробой верхней BB = BUY breakout
    if price > bb_upper:
        buy_score += 2
        buy_reasons.append("BB_breakout_up")
    # Пробой нижней BB = SELL breakout
    if price < bb_lower:
        sell_score += 2
        sell_reasons.append("BB_breakout_down")

    if buy_score == 0 and sell_score == 0:
        return None  # Нет пробоя — нет сигнала

    # Volume подтверждение (пробой на объёме > 1.5x = настоящий)
    if volume_ratio > 1.5:
        if buy_score > 0:
            buy_score += 1
            buy_reasons.append("vol={:.1f}x".format(volume_ratio))
        if sell_score > 0:
            sell_score += 1
            sell_reasons.append("vol={:.1f}x".format(volume_ratio))

    # EMA direction confirmation
    if ema9 > ema21:
        buy_score += 1
        buy_reasons.append("EMA_up")
    if ema9 < ema21:
        sell_score += 1
        sell_reasons.append("EMA_down")

    # RSI confirmation (импульс ещё не исчерпан, без перекрытия диапазонов)
    if 50 < rsi < 75:
        buy_score += 1
        buy_reasons.append("RSI={:.0f}(momentum)".format(rsi))
    if 25 < rsi < 50:
        sell_score += 1
        sell_reasons.append("RSI={:.0f}(momentum)".format(rsi))

    # MACD momentum
    if macd_hist > 0:
        buy_score += 1
        buy_reasons.append("MACD+")
    if macd_hist < 0:
        sell_score += 1
        sell_reasons.append("MACD-")

    # ── Candle pattern: импульсная свеча на пробое = подтверждение breakout ──
    if candle_signal:
        if candle_signal.bullish_score >= 1 and buy_score > 0:
            buy_score += 1
            buy_reasons.append("candle_momentum")
        if candle_signal.bearish_score >= 1 and sell_score > 0:
            sell_score += 1
            sell_reasons.append("candle_momentum")

    # Breakout SL/TP: широкий TP (ловим импульс)
    sl_bo = max(Decimal(str(round(atr * 1.5, 5))), BO_SL_PIPS)
    tp_bo = max(Decimal(str(round(atr * 3.0, 5))), BO_TP_PIPS)  # R:R = 1:2

    base_min = NORMAL_MIN_SCORE + 1 if session_name == "asian" else NORMAL_MIN_SCORE
    buy_min = AFTER_SL_SAME_DIR_MIN_SCORE if last_sl_direction and last_sl_direction.lower() == "buy" else base_min
    sell_min = AFTER_SL_SAME_DIR_MIN_SCORE if last_sl_direction and last_sl_direction.lower() == "sell" else base_min

    if buy_score >= buy_min and buy_score > sell_score:
        return TradeSignal(
            action=SignalAction.BUY, confidence=min(buy_score / 7.0, 1.0),
            reason="BREAKOUT BUY [{}pt/{}]: {}".format(buy_score, buy_min, ", ".join(buy_reasons)),
            sl_points=sl_bo, tp_points=tp_bo, regime="squeeze",
        )
    if sell_score >= sell_min and sell_score > buy_score:
        return TradeSignal(
            action=SignalAction.SELL, confidence=min(sell_score / 7.0, 1.0),
            reason="BREAKOUT SELL [{}pt/{}]: {}".format(sell_score, sell_min, ", ".join(sell_reasons)),
            sl_points=sl_bo, tp_points=tp_bo, regime="squeeze",
        )
    return None


# ═══════════════════════════════════════════════════════════════════
# ГЛАВНАЯ ФУНКЦИЯ: ОПРЕДЕЛИТЬ РЕЖИМ → ВЫБРАТЬ СТРАТЕГИЮ → СИГНАЛ
# ═══════════════════════════════════════════════════════════════════

def generate_signal(
    state_m15: MarketState,
    state_h1: Optional[MarketState] = None,
    state_h4: Optional[MarketState] = None,
    trend_h4: str = "side",
    symbol: str = "EURUSD",
    volume_ratio: float = 1.0,
    last_sl_direction: Optional[str] = None,
    consecutive_losses: int = 0,
    daily_trade_count: int = 0,
    loss_pause_expired: bool = False,
    session_name: str = "london",
    market_structure: Optional[MarketStructure] = None,
    candle_signal: Optional[CandleSignal] = None,
) -> TradeSignal:
    """
    Генерирует торговый сигнал. Автоматически определяет режим рынка
    и применяет подходящую стратегию.

    Режимы:
      TREND   (ADX > 20)     → Pullback strategy
      RANGE   (ADX < 20)     → Mean Reversion strategy
      SQUEEZE (BB width < 0.3%) → Breakout strategy
    """
    # Дефолтные SL/TP зависят от инструмента
    is_btc = symbol.upper() in ("BTCUSD", "BITCOIN")
    default_sl = BTC_SL if is_btc else FX_SL_PIPS
    default_tp = BTC_TP if is_btc else FX_TP_PIPS
    commission = BTC_COMMISSION if is_btc else COMMISSION_POINTS

    hold = TradeSignal(
        action=SignalAction.HOLD, confidence=0.0,
        reason="no signal", sl_points=default_sl, tp_points=default_tp,
        regime="unknown",
    )

    # ── Глобальные фильтры (до определения режима) ──
    if daily_trade_count >= MAX_TRADES_PER_DAY:
        return TradeSignal(
            action=SignalAction.HOLD, confidence=0.0,
            reason="max_daily: {} trades (max {})".format(daily_trade_count, MAX_TRADES_PER_DAY),
            sl_points=default_sl, tp_points=default_tp,
        )

    if consecutive_losses >= LOSS_PAUSE_THRESHOLD and not loss_pause_expired:
        return TradeSignal(
            action=SignalAction.HOLD, confidence=0.0,
            reason="loss_pause: {} losses — wait 60min".format(consecutive_losses),
            sl_points=default_sl, tp_points=default_tp,
        )

    if volume_ratio > FX_VOLUME_SPIKE_THRESHOLD:
        return TradeSignal(
            action=SignalAction.HOLD, confidence=0.0,
            reason="volume_spike: {:.1f}x".format(volume_ratio),
            sl_points=default_sl, tp_points=default_tp,
        )

    default_atr = 250.0 if is_btc else 0.0006
    atr = float(state_m15.atr_14 or default_atr)
    adx = float(state_m15.adx or 0)

    # ── Минимальный ATR: если ATR слишком мал, SL будет < спреда → гарантированный лосс ──
    min_atr = 20.0 if is_btc else 0.00020  # BTC: $20 мин, FX: 2 пипса мин
    if atr < min_atr:
        return TradeSignal(
            action=SignalAction.HOLD, confidence=0.0,
            reason="atr_too_low: {:.5f} < {:.5f}".format(atr, min_atr),
            sl_points=default_sl, tp_points=default_tp,
        )

    # ── Определяем режим рынка ──
    regime = detect_regime(state_m15)
    logger.debug("Market regime: %s (ADX=%.1f, BB_width=%s)", regime.value, adx, state_m15.bb_width)

    # ── Применяем стратегию по режиму ──
    signal = None

    if regime == MarketRegime.SQUEEZE:
        signal = _signal_breakout(
            state_m15, atr, volume_ratio, session_name, last_sl_direction,
            candle_signal=candle_signal,
        )
        if signal:
            logger.info("Signal [BREAKOUT]: %s (price=%s)", signal.reason, state_m15.price)

    elif regime == MarketRegime.TREND:
        signal = _signal_pullback(
            state_m15, state_h1, trend_h4, adx, atr, session_name, last_sl_direction,
            candle_signal=candle_signal,
        )
        if signal:
            logger.info("Signal [PULLBACK]: %s (price=%s)", signal.reason, state_m15.price)

    elif regime == MarketRegime.RANGE:
        signal = _signal_mean_reversion(
            state_m15, atr, session_name, last_sl_direction, trend_h4=trend_h4,
            candle_signal=candle_signal,
        )
        if signal:
            logger.info("Signal [MEAN_REV]: %s (price=%s)", signal.reason, state_m15.price)

    if signal:
        # ── Динамический SL/TP из рыночной структуры ──
        # Если доступна структура → SL/TP по свинг-уровням (умнее чем ATR)
        if market_structure and market_structure.support_levels and market_structure.resistance_levels:
            min_sl_val = float(BTC_MIN_SL if is_btc else FX_MIN_SL)
            max_sl_val = float(BTC_MAX_SL if is_btc else FX_MAX_SL)
            # FX скальпинг: R:R=1.2 достаточно при высоком win rate
            # BTC/другие: R:R=1.5 (свинг, нужен запас)
            is_fx = not is_btc and symbol.upper() in ("EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD")
            target_rr = 1.2 if is_fx else 1.5
            structural = compute_structural_sl_tp(
                structure=market_structure,
                direction=signal.action.value,
                atr=atr,
                min_sl=min_sl_val,
                max_sl=max_sl_val,
                min_rr=target_rr,
                commission=float(commission),
            )
            if structural and structural.rr_ratio >= target_rr:
                logger.info(
                    "Structural SL/TP: SL=%.5f TP=%.5f R:R=%.1f (%s)",
                    float(structural.sl_points), float(structural.tp_points),
                    structural.rr_ratio, structural.reason,
                )
                signal = TradeSignal(
                    action=signal.action, confidence=signal.confidence,
                    reason=signal.reason + " | " + structural.reason,
                    sl_points=structural.sl_points,
                    tp_points=structural.tp_points,
                    regime=signal.regime,
                )

        # Гарантия R:R >= 1:1 после комиссии: TP должен покрывать SL + комиссию
        min_tp = signal.sl_points + commission
        if signal.tp_points < min_tp:
            signal = TradeSignal(
                action=signal.action, confidence=signal.confidence,
                reason=signal.reason,
                sl_points=signal.sl_points,
                tp_points=min_tp,
                regime=signal.regime,
            )
        return signal

    # Нет сигнала от стратегии для текущего режима — HOLD (не пробуем другие режимы)
    reason = "HOLD: regime={} ADX={:.0f} (no signal from any strategy)".format(regime.value, adx)
    logger.debug("Signal: %s (price=%s)", reason, state_m15.price)
    return TradeSignal(
        action=SignalAction.HOLD, confidence=0.0,
        reason=reason, sl_points=default_sl, tp_points=default_tp,
        regime=regime.value,
    )
