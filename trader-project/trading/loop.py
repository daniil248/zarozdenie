"""
Основной торговый цикл: мультитаймфрейм → контекст (сессии, волатильность, новости) → сигнал → проверки риска → исполнение.
По ТЗ: цикл по расписанию каждые N минут.
"""
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.analysis.indicators import MarketState
from backend.analysis.multi_timeframe import MultiTimeframeState, get_multi_timeframe_state
from backend.analysis.market_structure import analyze_structure, format_structure_for_ai
from backend.analysis.candle_patterns import analyze_candle_patterns
from backend.broker.base import BrokerConnection
from backend.trading.signals import (
    SignalAction, TradeSignal, generate_signal,
)
from backend.ai.decision import confirm_signal
from backend.context.news import is_news_window, analyze_news_sentiment, NewsSentiment
from backend.context.trading_sessions import get_session_info
from backend.context.volatility import should_reduce_or_pause
from backend.db.models import Account, AccountState, Deal
from backend.risk.checks import can_open_position, calculate_dynamic_lot
from backend.risk.adaptive import get_adaptive_risk_pct, check_weekly_loss_limit
from backend.notifications import alert_drawdown_limit, alert_daily_loss_limit, alert_weekly_loss_limit, are_trade_notifications_enabled

logger = logging.getLogger(__name__)

# Метка бота на позициях — бот трогает ТОЛЬКО свои позиции
BOT_LABEL = "traider-bot"

# Порог "значимого убытка" — ниже этого считаем SL-хит (не комиссионный минус)
MEANINGFUL_LOSS_USD = Decimal("-1.50")

# Таймаут паузы после серии убытков (секунды). 60 мин = 3600 сек.
LOSS_PAUSE_TIMEOUT_SEC = 3600

# ─── ПЛАВНЫЙ ТРЕЙЛИНГ ──────────────────────────────────────────────
# Простая формула: SL = entry + (profit - gap)
# SL двигается каждый pip, только вперёд. Проверка каждые 3 сек.
#
# FX пример (gap=3):
#   profit +4 pip → SL = entry + 2 (безубыток, покрывает комиссию 1.6 pip)
#   profit +5 pip → SL = entry + 2 (profit - gap = 2)
#   profit +6 pip → SL = entry + 3
#   profit +10 pip → SL = entry + 7 ($3.50)
#   profit +20 pip → SL = entry + 17 ($8.50)
#   profit +30 pip → SL = entry + 27 ($13.50)
#   ...бесконечно

# FX параметры
FX_BE_TRIGGER = 4.0    # pip: при +4 pip → SL на безубыток
FX_BE_SL = 2.0         # pip: безубыток = entry + 2 pip (покрывает комиссию)
FX_TRAIL_GAP = 3.0     # pip: SL отстаёт на 3 pip от текущего профита

# XAU параметры (золото: 1 point = $0.01 при 0.01 лот)
XAU_BE_TRIGGER = 25.0  # points: при +25 pts → безубыток
XAU_BE_SL = 10.0       # points: безубыток = entry + 10 pts
XAU_TRAIL_GAP = 12.0   # points: SL отстаёт на 12 pts

# BTC спред-фильтр: макс $30 (в $ вместо пипсов)
BTC_MAX_SPREAD = 30.0

# Минимальный скор противоположного сигнала для закрытия текущей позиции
REVERSAL_CLOSE_MIN_SCORE = 5


# ─── Хелперы для bot_open_tickets (DB-backed) ─────────────────────────

def _load_bot_tickets(state: AccountState) -> set[int]:
    """Загрузить множество bot ticket_id из JSON-строки в AccountState."""
    if not state.bot_open_tickets:
        return set()
    try:
        return set(json.loads(state.bot_open_tickets))
    except (json.JSONDecodeError, TypeError):
        return set()


def _save_bot_tickets(state: AccountState, tickets: set[int]) -> None:
    """Сохранить множество bot ticket_id в AccountState как JSON."""
    state.bot_open_tickets = json.dumps(sorted(tickets)) if tickets else None


# ─── Хелперы ─────────────────────────────────────────────────────────

async def _get_or_update_day_start_account(
    session: AsyncSession,
    account_id: int,
    current_balance: Decimal,
) -> tuple[Optional[Decimal], Optional[datetime]]:
    """Для счёта (Account): обновляет balance_at_day_start при смене дня."""
    result = await session.execute(
        select(AccountState).where(AccountState.account_id == account_id)
    )
    state = result.scalar_one_or_none()
    if not state:
        return None, None
    now = datetime.now(timezone.utc)
    today = now.date()
    if state.day_start_date is None:
        state.balance_at_day_start = current_balance
        state.day_start_date = now
        await session.flush()
        return state.balance_at_day_start, state.day_start_date
    d = state.day_start_date
    existing_date = (d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d).date()
    if today > existing_date:
        state.balance_at_day_start = current_balance
        state.day_start_date = now
        await session.flush()
    return state.balance_at_day_start, state.day_start_date


def _today_start_utc() -> datetime:
    """Начало текущих суток UTC."""
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


async def _daily_pnl_from_broker(broker: BrokerConnection, from_time: datetime, symbol: Optional[str] = None) -> Decimal:
    """Суммарный PnL по закрытым сделкам с from_time по сегодня (из брокера)."""
    deals = await broker.get_closed_deals(symbol=symbol, from_time=from_time, to_time=None)
    cutoff = from_time if from_time.tzinfo else from_time.replace(tzinfo=timezone.utc)
    total = Decimal("0")
    for d in deals:
        if not d.close_time:
            continue
        ct = d.close_time.replace(tzinfo=timezone.utc) if d.close_time.tzinfo is None else d.close_time
        if ct >= cutoff:
            total += d.profit
    return total


async def _get_daily_trade_count(session: AsyncSession, account_id: int, symbol: str) -> int:
    """Количество сделок бота за сегодня (из Deal таблицы, переживает рестарт)."""
    today_start = _today_start_utc()
    result = await session.execute(
        select(func.count(Deal.id))
        .where(
            Deal.account_id == account_id,
            Deal.symbol == symbol,
            Deal.label == BOT_LABEL,
            Deal.open_time >= today_start,
        )
    )
    return result.scalar() or 0


async def _get_last_sl_direction(session: AsyncSession, account_id: int, symbol: str) -> tuple[Optional[str], int, Optional[datetime]]:
    """
    Определить направление последней сделки бота, закрытой по SL.

    Используем порог MEANINGFUL_LOSS_USD (-$1.50) вместо < 0,
    чтобы не считать комиссионные минусы (-$0.30) как SL.

    Возвращает (direction_or_None, consecutive_losses, last_loss_time).
    last_loss_time нужен для таймаута паузы (60 мин после 3 SL подряд).
    """
    recent_q = await session.execute(
        select(Deal)
        .where(Deal.account_id == account_id, Deal.symbol == symbol, Deal.label == BOT_LABEL)
        .order_by(Deal.close_time.desc())
        .limit(10)
    )
    recent_deals = recent_q.scalars().all()
    if not recent_deals:
        return None, 0, None

    # Серия значимых убытков подряд (игнорируем комиссионные минусы)
    consec_losses = 0
    last_loss_time = None
    for rd in recent_deals:
        if rd.profit is not None and rd.profit < MEANINGFUL_LOSS_USD:
            consec_losses += 1
            if last_loss_time is None:
                last_loss_time = rd.close_time
        else:
            break

    # Последняя сделка — если значимый убыток, значит закрылась по SL
    last = recent_deals[0]
    if last.profit is not None and last.profit < MEANINGFUL_LOSS_USD:
        return last.direction.lower() if last.direction else None, consec_losses, last_loss_time

    return None, consec_losses, last_loss_time


async def _sync_deals(
    session: AsyncSession,
    broker: BrokerConnection,
    acc: Account,
    bot_tickets: set[int],
) -> None:
    """Синхронизация закрытых сделок в БД. Вызывается в начале цикла, чтобы ранние return не пропускали синхронизацию."""
    symbol = getattr(acc, "symbol", None) or "EURUSD"
    deals = await broker.get_closed_deals(symbol=symbol)
    existing = await session.execute(select(Deal.ticket).where(Deal.account_id == acc.id))
    existing_tickets = set(existing.scalars().all())
    for d in deals:
        if d.ticket in existing_tickets:
            continue
        # Определяем label: если positionId совпадает с бот-позицией → BOT_LABEL
        deal_label = None
        if d.label:
            try:
                pos_id = int(d.label)
                if pos_id in bot_tickets:
                    deal_label = BOT_LABEL
            except (ValueError, TypeError):
                if d.label == BOT_LABEL:
                    deal_label = BOT_LABEL
        session.add(
            Deal(
                user_id=acc.user_id,
                account_id=acc.id,
                ticket=d.ticket,
                symbol=d.symbol,
                direction=d.direction,
                volume=d.volume,
                open_price=d.open_price,
                close_price=d.close_price,
                profit=d.profit,
                open_time=d.open_time,
                close_time=d.close_time,
                label=deal_label,
            )
        )
    await session.flush()


async def run_trading_cycle(account_id: int, session: AsyncSession, broker: BrokerConnection) -> None:
    """
    Один проход цикла по счёту (Account): данные → мультиТФ → контекст → сигнал → риск → исполнение.
    Вызывается планировщиком для каждого счёта с is_running=True.
    """
    acc_result = await session.execute(select(Account).where(Account.id == account_id))
    acc = acc_result.scalar_one_or_none()
    if not acc:
        logger.warning("run_trading_cycle: счёт account_id=%s не найден", account_id)
        return

    state_result = await session.execute(select(AccountState).where(AccountState.account_id == account_id))
    trading_state = state_result.scalar_one_or_none()
    if not trading_state or not trading_state.is_running:
        return

    if not await broker.is_connected():
        logger.warning("run_trading_cycle: брокер не подключён, account_id=%s", account_id)
        return

    account_info = await broker.get_account_info()
    if not account_info:
        logger.warning("run_trading_cycle: нет данных счёта")
        return

    symbol = getattr(acc, "symbol", None) or "EURUSD"

    # Загружаем bot_tickets из БД (переживает рестарт)
    bot_tickets = _load_bot_tickets(trading_state)

    # ── Синхронизация закрытых сделок (до любых ранних return) ──
    try:
        await _sync_deals(session, broker, acc, bot_tickets)
    except Exception as e:
        logger.debug("Deal sync error: %s", e)

    all_positions = await broker.get_positions(symbol=symbol)
    # Бот управляет ТОЛЬКО своими позициями (с меткой BOT_LABEL).
    positions = [p for p in all_positions if p.label == BOT_LABEL]
    # positions_count: max из live позиций и bot_tickets из БД
    # Защита от открытия лишних при рестарте (когда broker ещё не вернул позиции)
    positions_count = max(len(positions), len(bot_tickets))

    # Обновляем bot_tickets: добавляем текущие, убираем закрытые
    current_tickets = {p.ticket for p in positions}
    bot_tickets = (bot_tickets | current_tickets)
    # Убираем ticket'ы которые больше нет в открытых позициях и которые уже в Deal
    closed_tickets_in_db = set()
    if bot_tickets - current_tickets:
        check_result = await session.execute(
            select(Deal.ticket).where(Deal.ticket.in_(bot_tickets - current_tickets))
        )
        closed_tickets_in_db = set(check_result.scalars().all())
    bot_tickets = current_tickets | (bot_tickets - closed_tickets_in_db)
    _save_bot_tickets(trading_state, bot_tickets)
    await session.flush()

    # Мультитаймфрейм
    try:
        mtf = await get_multi_timeframe_state(broker, symbol=symbol)
    except Exception as e:
        logger.exception("run_trading_cycle: ошибка мультиТФ: %s", e)
        return

    # ══════════════════════════════════════════════════════════════════
    # ПЛАВНЫЙ ТРЕЙЛИНГ (каждые 3 сек, каждый pip)
    # SL = entry + (profit - gap). SL только вперёд.
    # ══════════════════════════════════════════════════════════════════
    is_fx = symbol.upper() in ("EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD")
    is_btc = symbol.upper() in ("BTCUSD", "BITCOIN")
    is_xau = symbol.upper() in ("XAUUSD",)
    if (is_fx or is_btc or is_xau) and positions:
        try:
            live_q = await broker.get_quote(symbol)
            if live_q:
                for pos in positions:
                    # Бот управляет ТОЛЬКО своими позициями — ручные не трогаем
                    if pos.label != BOT_LABEL:
                        continue
                    entry = float(pos.open_price)
                    is_buy = pos.direction.lower().startswith("buy")
                    current = float(live_q.bid) if is_buy else float(live_q.ask)

                    # Profit в единицах (pip для FX, points для XAU)
                    if is_xau:
                        profit_units = (current - entry) if is_buy else (entry - current)
                        unit_factor = 1.0
                        be_trigger = XAU_BE_TRIGGER
                        be_sl = XAU_BE_SL
                        trail_gap = XAU_TRAIL_GAP
                        max_orig_tp = 500.0
                    else:
                        profit_units = ((current - entry) if is_buy else (entry - current)) * 10000
                        unit_factor = 0.0001
                        be_trigger = FX_BE_TRIGGER
                        be_sl = FX_BE_SL
                        trail_gap = FX_TRAIL_GAP
                        max_orig_tp = 50.0

                    # ══════════════════════════════════════════════════════════
                    # ПЛАВНЫЙ ТРЕЙЛИНГ — SL = entry + (profit - gap)
                    # Двигается каждый pip. Только вперёд. Каждые 3 сек.
                    # ══════════════════════════════════════════════════════════
                    new_trail_sl = None

                    if profit_units >= be_trigger:
                        # Формула: SL = profit - gap (но не ниже безубытка)
                        new_trail_sl = max(profit_units - trail_gap, be_sl)

                    if new_trail_sl is not None and new_trail_sl > 0:
                        if is_buy:
                            new_sl = entry + new_trail_sl * unit_factor
                        else:
                            new_sl = entry - new_trail_sl * unit_factor

                        # SL двигается ТОЛЬКО вперёд (минимум +1 pip шаг)
                        current_sl = float(pos.sl) if pos.sl else None
                        min_step = 0.0001 if not is_xau else 0.01
                        should_move = False
                        if current_sl is None:
                            should_move = True
                        elif is_buy and new_sl > current_sl + min_step:
                            should_move = True
                        elif not is_buy and new_sl < current_sl - min_step:
                            should_move = True

                        if should_move:
                            try:
                                current_tp = Decimal(str(pos.tp)) if pos.tp else None

                                # TP extension: ОДИН раз при безубытке → TP +50%
                                # Защита: если tp_dist > max_orig_tp — уже расширяли
                                tp_extended = False
                                if current_tp and float(current_tp) > 0:
                                    if is_buy:
                                        tp_dist = (float(current_tp) - entry) / unit_factor
                                    else:
                                        tp_dist = (entry - float(current_tp)) / unit_factor
                                    if 0 < tp_dist < max_orig_tp:
                                        new_tp_d = tp_dist * 1.5
                                        if is_buy:
                                            current_tp = Decimal(str(round(entry + new_tp_d * unit_factor, 5)))
                                        else:
                                            current_tp = Decimal(str(round(entry - new_tp_d * unit_factor, 5)))
                                        tp_extended = True
                                        logger.info("TP EXTEND: ticket=%s TP %.1f→%.1f (BE reached, +50%%)",
                                                    pos.ticket, tp_dist, new_tp_d)

                                await broker.modify_position(
                                    pos.ticket,
                                    stop_loss=Decimal(str(round(new_sl, 5))),
                                    take_profit=current_tp,
                                )
                                unit_label = "pts" if is_xau else "pip"
                                logger.info(
                                    "TRAIL: ticket=%s SL→%.5f (+%.1f %s) at +%.1f %s profit",
                                    pos.ticket, new_sl, new_trail_sl, unit_label,
                                    profit_units, unit_label,
                                )
                            except Exception:
                                pass

                    logger.debug("Position: ticket=%s %.1f %s from entry", pos.ticket, profit_units, "USD" if is_btc else "pips")

        except Exception as e:
            logger.debug("Trailing check error: %s", e)

    # Обновление баланса на старт дня по счёту
    balance_at_day_start, _ = await _get_or_update_day_start_account(session, account_id, account_info.balance)
    today_start = _today_start_utc()
    daily_pnl = await _daily_pnl_from_broker(broker, today_start, symbol=symbol)

    market_state = mtf.state_m15 or mtf.state_h1
    if not market_state:
        logger.debug("run_trading_cycle: недостаточно данных для индикаторов")
        return

    # Контекст: сессия, волатильность, новости
    session_info = get_session_info()
    vol_high, vol_reason = should_reduce_or_pause(mtf.atr_m15, mtf.atr_h1, symbol=symbol)
    news_win, news_desc = is_news_window(symbol=symbol)

    # FX скальпинг: жёсткий блок вне торговых сессий
    if is_fx and not session_info.allow_trading:
        if not positions:
            logger.debug("run_trading_cycle: %s вне торговой сессии (%s) — пропуск", symbol, session_info.name)
            return

    # FX скальпинг: жёсткий блок при высокой волатильности
    if is_fx and vol_high and not positions:
        logger.info("run_trading_cycle: %s высокая волатильность — пропуск (%s)", symbol, vol_reason)
        return

    # FX скальпинг: недельный лимит убытков (5%)
    if is_fx and not positions:
        weekly_ok, weekly_reason = await check_weekly_loss_limit(
            session, account_id, symbol, account_info.balance, balance_at_day_start
        )
        if not weekly_ok:
            logger.info("run_trading_cycle: %s — %s", symbol, weekly_reason)
            try:
                await alert_weekly_loss_limit(acc.name or str(account_id), symbol, weekly_reason)
            except Exception:
                pass
            return

    # FX скальпинг: жёсткий блок при новостях
    if is_fx and news_win and not positions:
        logger.info("run_trading_cycle: %s новостное окно — пропуск (%s)", symbol, news_desc)
        return

    # AI-анализ тональности новостей (кэш 15 мин, не блокирует при ошибке)
    news_sentiment: Optional[NewsSentiment] = None
    if not positions:
        try:
            news_sentiment = await analyze_news_sentiment(symbol=symbol)
            if news_sentiment and news_sentiment.events_analyzed > 0:
                logger.info(
                    "News sentiment %s: %s impact=%s (%s)",
                    symbol, news_sentiment.sentiment, news_sentiment.impact, news_sentiment.summary,
                )
        except Exception as e:
            logger.debug("News sentiment analysis failed: %s", e)

    # ══════════════════════════════════════════════════════════════════
    # АЛГОРИТМИЧЕСКИЙ СИГНАЛ
    # ══════════════════════════════════════════════════════════════════

    # Загружаем из БД: последняя SL-сделка бота, серию убытков и время последнего убытка
    last_sl_dir, consec_losses, last_loss_time = await _get_last_sl_direction(session, account_id, symbol)

    # Таймаут паузы: если 3+ убытков, но прошло > 60 мин — пауза истекла
    loss_pause_expired = False
    if consec_losses >= 3 and last_loss_time:
        lt = last_loss_time.replace(tzinfo=timezone.utc) if last_loss_time.tzinfo is None else last_loss_time
        seconds_since_loss = (datetime.now(timezone.utc) - lt).total_seconds()
        if seconds_since_loss >= LOSS_PAUSE_TIMEOUT_SEC:
            loss_pause_expired = True
            logger.info("Loss pause expired: %.0f min since last SL (timeout=%d sec)",
                        seconds_since_loss / 60, LOSS_PAUSE_TIMEOUT_SEC)

    # Количество сделок бота за сегодня (из БД, переживает рестарт)
    daily_trade_count = await _get_daily_trade_count(session, account_id, symbol)

    # Вычисляем volume ratio для детекции накачки
    vol_current = int(market_state.volume or 0)
    avg_vol = int(market_state.avg_volume or 0)
    vol_ratio = (vol_current / avg_vol) if avg_vol > 0 else 1.0

    # Effective trend: H4 приоритет, при H4=side fallback на H1
    effective_trend = mtf.trend_h4 if mtf.trend_h4 != "side" else mtf.trend_h1

    # ── Анализ рыночной структуры (свинг-уровни, поддержка/сопротивление) ──
    # Используем свечи из MTF (не дублируем запросы к брокеру)
    mkt_structure = None
    try:
        atr_val = float(market_state.atr_14 or (250.0 if is_btc else 0.0006))
        if mtf.candles_m15 and len(mtf.candles_m15) >= 20:
            mkt_structure = analyze_structure(mtf.candles_m15, mtf.candles_h1, atr=atr_val)
            if mkt_structure.support_levels or mkt_structure.resistance_levels:
                logger.info(
                    "Market structure: %d support, %d resistance levels",
                    len(mkt_structure.support_levels), len(mkt_structure.resistance_levels),
                )
    except Exception as e:
        logger.debug("Market structure analysis error: %s", e)

    # ── Анализ свечных паттернов (pin bar, engulfing, doji, momentum) ──
    candle_sig = None
    try:
        atr_for_candles = float(market_state.atr_14 or (250.0 if is_btc else 0.0006))
        if mtf.candles_m15 and len(mtf.candles_m15) >= 3:
            candle_sig = analyze_candle_patterns(mtf.candles_m15, atr_for_candles)
            if candle_sig.patterns:
                logger.info("Candle patterns: bull=%d bear=%d %s",
                            candle_sig.bullish_score, candle_sig.bearish_score, candle_sig.patterns)
    except Exception as e:
        logger.debug("Candle pattern analysis error: %s", e)

    signal = generate_signal(
        state_m15=market_state,
        state_h1=mtf.state_h1,
        state_h4=mtf.state_h4,
        trend_h4=effective_trend,
        symbol=symbol,
        volume_ratio=vol_ratio,
        last_sl_direction=last_sl_dir,
        consecutive_losses=consec_losses,
        daily_trade_count=daily_trade_count,
        loss_pause_expired=loss_pause_expired,
        session_name=session_info.name,
        market_structure=mkt_structure,
        candle_signal=candle_sig,
    )

    # ── Если есть открытая БОТ-позиция — проверяем разворот сигнала ──
    bot_positions = [p for p in positions if p.label == BOT_LABEL]
    if bot_positions:
        # Проверяем: сигнал противоположный текущей позиции?
        # Если да и confidence >= 4 очков → закрыть текущую
        pos = bot_positions[0]
        pos_is_buy = pos.direction.lower().startswith("buy")
        signal_is_opposite = (
            (pos_is_buy and signal.action == SignalAction.SELL) or
            (not pos_is_buy and signal.action == SignalAction.BUY)
        )
        if signal_is_opposite and signal.confidence >= 0.60:
            try:
                ok = await broker.close_position(pos.ticket)
                if ok:
                    logger.info(
                        "REVERSAL CLOSE: ticket=%s %s → new signal %s (conf=%.0f%%)",
                        pos.ticket, pos.direction, signal.action.value, signal.confidence * 100
                    )
                    await _notify_reversal_telegram(pos, signal, symbol)
                    positions = []
                    positions_count = 0
                    # НЕ return — проваливаемся ниже в блок открытия новой сделки
            except Exception as e:
                logger.debug("Reversal close failed: %s", e)
        else:
            logger.info("run_trading_cycle: есть %d позиций — трейлинг выше, сигнал=%s",
                         positions_count, signal.action.value)

    # ── Нет открытых позиций (или только что закрыли по развороту) — можно открывать ──
    if not positions and signal.action == SignalAction.HOLD:
        logger.info("run_trading_cycle: HOLD — %s", signal.reason)

    # ── Защита от дублирования: не открываем вторую позицию в том же направлении ──
    if positions and signal.action in (SignalAction.BUY, SignalAction.SELL):
        for bp in bot_positions:
            bp_is_buy = bp.direction.lower().startswith("buy")
            same_dir = (bp_is_buy and signal.action == SignalAction.BUY) or \
                       (not bp_is_buy and signal.action == SignalAction.SELL)
            if same_dir:
                bp_entry = float(bp.open_price)
                cur_price = float(market_state.price)
                dist = abs(cur_price - bp_entry)
                if is_xau:
                    dist_units = dist
                else:
                    dist_units = dist * 10000  # pips
                threshold = 5.0 if not is_xau else 30.0
                if dist_units > threshold:
                    logger.info(
                        "SKIP DUPLICATE: already %s at %.5f, price %.1f %s away — wait for pullback",
                        bp.direction, bp_entry, dist_units, "pts" if is_xau else "pip",
                    )
                    return

    if not positions and signal.action in (SignalAction.BUY, SignalAction.SELL):
        direction = signal.action.value  # "buy" or "sell"

        # ── Unrealized P&L фильтр: не открываем новые если текущие позиции в большом минусе ──
        if bot_positions:
            total_unrealized = 0.0
            for bp in bot_positions:
                if hasattr(bp, 'profit') and bp.profit is not None:
                    total_unrealized += float(bp.profit)
            if total_unrealized < -10.0:
                logger.info("UNREALIZED LOSS FILTER: open positions at $%.2f — skip new entry", total_unrealized)
                return

        # ── Spread-фильтр: не открываем при широком спреде ──
        try:
            quote = await broker.get_quote(symbol)
            if quote and quote.ask and quote.bid:
                spread = float(quote.ask - quote.bid)
                if is_btc:
                    max_spread = BTC_MAX_SPREAD
                else:
                    # FX: макс спред = 30% от SL (если SL=12 pip → макс спред ~3.6 pip)
                    max_spread = float(signal.sl_points) * 0.30
                if spread > max_spread:
                    logger.info(
                        "SPREAD FILTER: %s spread=%.5f > max=%.5f — skip entry",
                        symbol, spread, max_spread,
                    )
                    return
        except Exception as e:
            logger.debug("Spread check failed: %s", e)

        # ── AI CONFIRMATION: подтверждение сигнала через LLM ──
        try:
            structure_text = format_structure_for_ai(mkt_structure) if mkt_structure else ""
            news_text = ""
            if news_sentiment and news_sentiment.events_analyzed > 0:
                news_text = "Sentiment: {} impact={} ({})".format(
                    news_sentiment.sentiment, news_sentiment.impact, news_sentiment.summary or "",
                )

            # Краткая сводка последних сделок
            trades_summary = ""
            if consec_losses > 0:
                trades_summary = "{} consecutive losses (last SL: {})".format(consec_losses, last_sl_dir or "?")

            ai_verdict, ai_sl, ai_tp, ai_comment = await confirm_signal(
                signal_direction=direction,
                signal_reason=signal.reason,
                signal_confidence=signal.confidence,
                market_state=market_state,
                trend_h4=effective_trend,
                session_name=session_info.name,
                news_summary=news_text,
                structure_info=structure_text,
                sl_points=float(signal.sl_points),
                tp_points=float(signal.tp_points),
                recent_trades_summary=trades_summary,
                symbol=symbol,
            )

            if ai_verdict == "REJECT":
                logger.info("AI REJECTED signal: %s %s — %s", direction, symbol, ai_comment)
                return

            if ai_verdict == "ADJUST" and ai_sl is not None:
                signal = TradeSignal(
                    action=signal.action, confidence=signal.confidence,
                    reason=signal.reason + " | AI:" + ai_comment,
                    sl_points=Decimal(str(round(ai_sl, 5))),
                    tp_points=Decimal(str(round(ai_tp, 5))) if ai_tp else signal.tp_points,
                    regime=signal.regime,
                )
                logger.info("AI ADJUSTED SL/TP: SL=%.5f TP=%.5f — %s", ai_sl, ai_tp or 0, ai_comment)
            else:
                logger.info("AI CONFIRMED: %s %s — %s", direction, symbol, ai_comment)
        except Exception as e:
            logger.warning("AI confirm error (auto-confirming): %s", e)

        # ── Sentiment-фильтр: AI-анализ новостей vs направление сигнала ──
        if news_sentiment and news_sentiment.events_analyzed > 0:
            sent = news_sentiment.sentiment
            is_contradicting = (
                (direction == "buy" and sent == "bearish_instrument") or
                (direction == "sell" and sent == "bullish_instrument")
            )
            if is_contradicting and news_sentiment.impact == "high":
                # High impact + противоречие → БЛОК
                logger.info(
                    "SENTIMENT BLOCK: %s signal=%s but sentiment=%s impact=high (%s)",
                    symbol, direction, sent, news_sentiment.summary,
                )
                return
            # Среднее противоречие логируем, но не блокируем — снизим лот ниже

        # Динамический лот: адаптивный % риска от эквити
        adaptive_risk = await get_adaptive_risk_pct(session, account_id, symbol)
        if is_fx:
            sl_pips_est = float(signal.sl_points) * 10000
            pip_value = 10.0  # $10/pip на 1.0 лот для FX
        elif is_btc:
            sl_pips_est = float(signal.sl_points)  # SL уже в $ (напр. $200)
            pip_value = 1.0   # $1 за $1 движение на 1 BTC (1 лот)
        else:
            sl_pips_est = float(signal.sl_points)
            pip_value = 1.0

        # Сессионная коррекция: в Азии снижаем риск на 50% (спреды шире) — только для FX
        if is_fx and session_info.reduce_activity:
            adaptive_risk = max(adaptive_risk * Decimal("0.5"), Decimal("0.5"))

        # Sentiment-коррекция: medium impact + противоречие → риск -50%
        if news_sentiment and news_sentiment.events_analyzed > 0:
            sent = news_sentiment.sentiment
            is_contradicting = (
                (direction == "buy" and sent == "bearish_instrument") or
                (direction == "sell" and sent == "bullish_instrument")
            )
            if is_contradicting and news_sentiment.impact == "medium":
                adaptive_risk = max(adaptive_risk * Decimal("0.5"), Decimal("0.5"))
                logger.info(
                    "SENTIMENT LOT REDUCE: %s signal=%s sentiment=%s impact=medium → risk=%s%%",
                    symbol, direction, sent, adaptive_risk,
                )

        volume = calculate_dynamic_lot(
            equity=account_info.equity,
            risk_pct=adaptive_risk,
            sl_pips=sl_pips_est,
            pip_value_per_lot=pip_value,
            min_lot=Decimal("0.01"),
            max_lot=acc.lot if acc.lot > Decimal("0.01") else Decimal("0.50"),
            lot_step=Decimal("0.01"),
        )

        # ── УСРЕДНЕНИЕ ПОСЛЕ SL: удвоение лота если предыдущая SL в том же направлении ──
        # Макс 2 уровня: 0.05 → 0.10 → 0.20. Дальше — стоп.
        # Только если тренд ЕЩЁ актуален (тот же direction что SL).
        recovery_mult = 1
        if last_sl_dir and last_sl_dir.lower() == direction:
            if consec_losses == 1:
                recovery_mult = 2  # 0.05 → 0.10
            elif consec_losses >= 2:
                recovery_mult = 4  # 0.05 → 0.20
            if recovery_mult > 1:
                old_vol = volume
                volume = min(volume * recovery_mult, acc.lot * 4)  # не больше 4x от базового лота
                # Округляем до шага лота
                lot_step = Decimal("0.05")
                volume = Decimal(str(int(float(volume) / float(lot_step)) * float(lot_step)))
                volume = max(volume, Decimal("0.05"))
                logger.info("RECOVERY LOT: %s → %s (x%d after %d SL losses in same direction)",
                            old_vol, volume, recovery_mult, consec_losses)

        logger.info("Dynamic lot: equity=%s risk=%s%% SL=%.1fpips → vol=%s (session=%s)",
                     account_info.equity, adaptive_risk, sl_pips_est, volume, session_info.name)
        ok, reason = can_open_position(
            current_equity=account_info.equity,
            balance_at_day_start=balance_at_day_start,
            max_drawdown_pct=acc.max_drawdown_pct,
            current_positions_count=positions_count,
            max_positions=acc.max_positions,
            requested_volume=volume,
            allowed_lot=acc.lot,
            daily_pnl=daily_pnl,
            max_daily_loss=acc.max_daily_loss,
        )
        if not ok:
            logger.info("run_trading_cycle: риск-лимит — %s", reason)
            # Telegram-алерты при блокировке по риску
            try:
                if "просадк" in reason.lower() or "drawdown" in reason.lower():
                    dd_pct = 0.0
                    if balance_at_day_start and balance_at_day_start > 0:
                        dd_pct = float((balance_at_day_start - account_info.equity) / balance_at_day_start * 100)
                    await alert_drawdown_limit(
                        acc.name or str(account_id), dd_pct,
                        float(acc.max_drawdown_pct or 0),
                        float(account_info.equity), float(balance_at_day_start or 0),
                    )
                elif "дневн" in reason.lower() or "daily" in reason.lower():
                    await alert_daily_loss_limit(
                        acc.name or str(account_id),
                        float(daily_pnl), float(acc.max_daily_loss or 0),
                    )
            except Exception:
                pass  # алерты не должны ломать торговлю
        else:
            # Получаем live-котировку
            live_q = None
            try:
                live_q = await broker.get_quote(symbol)
            except Exception:
                pass

            # Спред-фильтр
            if live_q:
                spread_raw = float(live_q.ask) - float(live_q.bid)
                if is_fx:
                    spread_pips = spread_raw * 10000
                    if spread_pips > 1.2:
                        logger.info("run_trading_cycle: спред %.1f pips > 1.2 — пропуск", spread_pips)
                        return
                elif is_btc:
                    if spread_raw > BTC_MAX_SPREAD:
                        logger.info("run_trading_cycle: BTC спред $%.0f > $%.0f — пропуск", spread_raw, BTC_MAX_SPREAD)
                        return

            if live_q:
                sl_points = signal.sl_points
                tp_points = signal.tp_points

                # Ограничения SL/TP для FX (10-15 пипсов SL, мин 8 пипсов TP)
                if is_fx:
                    from backend.trading.signals import FX_MIN_SL, FX_MAX_SL
                    sl_points = max(min(sl_points, FX_MAX_SL), FX_MIN_SL)
                    tp_points = max(tp_points, FX_MIN_SL)
                elif is_btc:
                    from backend.trading.signals import BTC_MIN_SL, BTC_MAX_SL
                    sl_points = max(min(sl_points, BTC_MAX_SL), BTC_MIN_SL)
                    tp_points = max(tp_points, BTC_MIN_SL)

                _dec = 2 if "XAU" in symbol or is_btc else 5
                price = Decimal(str(round(
                    float(live_q.ask if direction == "buy" else live_q.bid), _dec
                )))

                if direction == "buy":
                    stop_loss = price - sl_points
                    take_profit = price + tp_points
                else:
                    stop_loss = price + sl_points
                    take_profit = price - tp_points

                ticket = await broker.open_position(
                    symbol=symbol,
                    direction="Buy" if direction == "buy" else "Sell",
                    volume=volume,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    label=BOT_LABEL,
                )
                if ticket is not None:
                    # Сохраняем ticket в БД (переживает рестарт)
                    bot_tickets.add(ticket)
                    _save_bot_tickets(trading_state, bot_tickets)
                    await session.flush()

                    spread_info = ""
                    if is_fx:
                        sp = (float(live_q.ask) - float(live_q.bid)) * 10000
                        spread_info = f" spread={sp:.1f}pip"
                    sentiment_info = ""
                    if news_sentiment and news_sentiment.events_analyzed > 0:
                        sentiment_info = f" sentiment={news_sentiment.sentiment}/{news_sentiment.impact}"
                    logger.info(
                        "SIGNAL OPEN ticket=%s %s %s vol=%s entry=%s sl=%s tp=%s "
                        "(SL=%.1fpips TP=%.1fpips%s%s) reason=[%s] conf=%.0f%% [%s]",
                        ticket, direction, symbol, volume, price, stop_loss, take_profit,
                        float(sl_points) * (10000 if is_fx else 1),
                        float(tp_points) * (10000 if is_fx else 1),
                        spread_info, sentiment_info, signal.reason, signal.confidence * 100, acc.name,
                    )
                    # Telegram уведомление (с именем аккаунта и ADX)
                    await _notify_signal_telegram(
                        signal, market_state, symbol, price, sl_points, tp_points, volume,
                        account_name=acc.name, risk_pct=adaptive_risk,
                        news_sentiment=news_sentiment,
                    )


async def _notify_reversal_telegram(pos, signal: TradeSignal, symbol: str) -> None:
    """Уведомление в Telegram о закрытии позиции по развороту сигнала."""
    if not await are_trade_notifications_enabled():
        return
    from backend.config import get_settings
    import httpx

    settings = get_settings()
    bot_token = settings.bot_token
    if not bot_token:
        return

    text = "\U0001f504 REVERSAL CLOSE {}\n{} ticket={}\nNew signal: {} (conf={:.0f}%)".format(
        symbol, pos.direction, pos.ticket,
        signal.action.value.upper(), signal.confidence * 100,
    )

    # Используем admin_ids напрямую
    admin_ids = settings.admin_ids_set
    chat_ids = list(admin_ids) if admin_ids else []

    async with httpx.AsyncClient() as http:
        for chat_id in chat_ids:
            try:
                await http.post(
                    "https://api.telegram.org/bot{}/sendMessage".format(bot_token),
                    json={"chat_id": chat_id, "text": text},
                    timeout=5,
                )
            except Exception:
                pass


async def _notify_signal_telegram(
    signal: TradeSignal, state: MarketState, symbol: str,
    price: Decimal, sl: Decimal, tp: Decimal, volume: Decimal,
    account_name: str = "", risk_pct: Decimal = Decimal("1.0"),
    news_sentiment: Optional[NewsSentiment] = None,
) -> None:
    """Отправляет сигнал в Telegram."""
    if not await are_trade_notifications_enabled():
        return
    from backend.config import get_settings
    import httpx

    settings = get_settings()
    bot_token = settings.bot_token
    if not bot_token:
        return

    direction = signal.action.value.upper()
    sl_pips = float(sl) * 10000
    tp_pips = float(tp) * 10000
    buy_emoji = "\U0001f7e2"
    sell_emoji = "\U0001f534"
    emoji = buy_emoji if signal.action == SignalAction.BUY else sell_emoji

    adx_info = " ADX:{}".format(state.adx) if state.adx else ""
    acc_info = " [{}]".format(account_name) if account_name else ""
    safe_reason = signal.reason.replace("<", "").replace(">", "").replace("&", "")

    # Sentiment строка для Telegram
    sentiment_line = ""
    if news_sentiment and news_sentiment.events_analyzed > 0:
        sent_emoji = {"bullish_instrument": "\U0001f4c8", "bearish_instrument": "\U0001f4c9", "neutral": "\u2796"}
        se = sent_emoji.get(news_sentiment.sentiment, "\u2796")
        sentiment_line = "\nNews: {} {} ({})".format(
            se, news_sentiment.sentiment.replace("_instrument", ""),
            news_sentiment.summary[:60] if news_sentiment.summary else news_sentiment.impact,
        )

    text = "{} ALGO {} {}{}\nPrice: {} | Vol: {} (risk {}%)\nSL: {:.1f}pip | TP: {:.1f}pip\nSignal: {}\nConf: {:.0f}% | RSI:{}{}{}" .format(
        emoji, direction, symbol, acc_info,
        state.price, volume, risk_pct,
        sl_pips, tp_pips,
        safe_reason, signal.confidence * 100,
        state.rsi, adx_info, sentiment_line,
    )

    # Используем admin_ids напрямую (без лишнего запроса в БД)
    admin_ids = settings.admin_ids_set
    chat_ids = list(admin_ids) if admin_ids else []

    async with httpx.AsyncClient() as http:
        for chat_id in chat_ids:
            try:
                await http.post(
                    "https://api.telegram.org/bot{}/sendMessage".format(bot_token),
                    json={"chat_id": chat_id, "text": text},
                    timeout=5,
                )
            except Exception:
                pass
