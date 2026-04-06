"""
Планировщик торгового цикла.
Каждые N минут запускает run_trading_cycle для каждого счёта с is_running=True.
Использует персистентные подключения через ConnectionManager (не пересоздаёт клиент каждый тик).
"""
import asyncio
import logging

from sqlalchemy import select

from backend.broker.connection_manager import broker_manager
from backend.broker.mock_broker import get_global_mock_broker
from backend.config import get_settings
from backend.db.database import get_session
from backend.db.models import Account, AccountState
from backend.notifications import (
    alert_broker_disconnect,
    alert_broker_reconnected,
    maybe_send_heartbeat,
)
from backend.trading.loop import run_trading_cycle

logger = logging.getLogger(__name__)


def _connection_params(acc: Account) -> tuple:
    """(host, port, sender_comp_id, username, password) из счёта + env."""
    cfg = get_settings()
    host = (acc.fix_host or cfg.fix_host or "demo").strip()
    port = 5035  # cTrader Open API (не FIX)
    sender_comp_id = (acc.sender_comp_id or cfg.sender_comp_id or "").strip()
    username = (acc.broker_login or cfg.broker_login or "").strip()
    password = (cfg.broker_password or "").strip()  # accessToken из env
    return host, port, sender_comp_id, username, password


async def _run_cycle_for_account(account_id: int, acc: Account) -> None:
    """Один торговый цикл для счёта через персистентное подключение."""
    cfg = get_settings()

    # Mock-режим: используем глобальный singleton MockBroker без реальных учётных данных
    if cfg.use_mock_broker:
        broker = get_global_mock_broker()
        async with get_session() as session:
            try:
                await run_trading_cycle(account_id, session, broker)
            except Exception as e:
                logger.exception("scheduler[mock]: ошибка цикла для счёта %s: %s", account_id, e)
        return

    host, port, sender, username, password = _connection_params(acc)

    if not username or not password:
        logger.debug(
            "scheduler: пропуск счёта %s (%s) — не заданы ctidTraderAccountId или accessToken",
            account_id,
            acc.name,
        )
        return
    if not sender:
        logger.debug(
            "scheduler: пропуск счёта %s (%s) — не задан clientId",
            account_id,
            acc.name,
        )
        return

    # Запоминаем, был ли клиент до подключения (для детекции reconnect)
    was_failed = broker_manager.is_failed(account_id)

    broker = await broker_manager.get(
        account_id,
        host=host,
        port=port,
        sender_comp_id=sender,
        username=username,
        password=password,
    )
    if not broker:
        logger.warning(
            "scheduler: не удалось подключиться к cTrader для счёта %s (%s)",
            account_id,
            acc.name,
        )
        await alert_broker_disconnect(acc.name or str(account_id), username)
        return

    # Если был в сбое и теперь подключился — уведомить о восстановлении
    if was_failed:
        await alert_broker_reconnected(acc.name or str(account_id), username)

    async with get_session() as session:
        try:
            await run_trading_cycle(account_id, session, broker)
        except Exception as e:
            logger.exception("scheduler: ошибка цикла для счёта %s: %s", account_id, e)


async def _tick() -> None:
    """Один тик: запускаем цикл для всех активных счетов."""
    async with get_session() as session:
        try:
            result = await session.execute(
                select(AccountState, Account)
                .join(Account, Account.id == AccountState.account_id)
                .where(AccountState.is_running == True)  # noqa: E712
            )
            rows = result.all()
        except Exception as e:
            logger.exception("scheduler: ошибка выборки счетов: %s", e)
            return

    # Запускаем счета конкурентно (у каждого своя сессия и свой брокер)
    tasks = [
        asyncio.create_task(_run_cycle_for_account(acc.id, acc))
        for _state, acc in rows
    ]
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

    # Heartbeat: только если есть running аккаунты
    if rows:
        await _collect_and_send_heartbeat(rows)


async def _collect_and_send_heartbeat(rows) -> None:
    """Собрать метрики по running счетам и отправить heartbeat."""
    try:
        from datetime import datetime, timezone
        active_accounts = len(rows)
        total_positions = 0
        total_equity = 0.0
        total_daily_pnl = 0.0

        seen_brokers = set()
        for state, acc in rows:
            broker_key = acc.broker_login or str(acc.id)
            if broker_key in seen_brokers:
                continue

            broker = broker_manager.get_cached(acc.id)
            if broker:
                try:
                    seen_brokers.add(broker_key)
                    all_pos = await broker.get_positions()
                    total_positions += len(all_pos)
                    info = await broker.get_account_info()
                    total_equity += float(info.equity)

                    # P&L из реальных закрытых сделок брокера (не equity delta)
                    now = datetime.now(timezone.utc)
                    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                    try:
                        deals = await broker.get_closed_deals(from_time=today_start, to_time=None)
                        for d in deals:
                            if d.close_time:
                                ct = d.close_time.replace(tzinfo=timezone.utc) if d.close_time.tzinfo is None else d.close_time
                                if ct >= today_start:
                                    total_daily_pnl += float(d.profit)
                    except Exception:
                        # Fallback на equity delta если нет доступа к сделкам
                        if state.balance_at_day_start:
                            total_daily_pnl += float(info.equity) - float(state.balance_at_day_start)

                    # Добавляем unrealized P&L открытых позиций
                    for pos in all_pos:
                        if hasattr(pos, 'profit') and pos.profit is not None:
                            total_daily_pnl += float(pos.profit)
                except Exception:
                    pass

        await maybe_send_heartbeat(active_accounts, total_positions, total_equity, total_daily_pnl)
    except Exception as e:
        logger.debug("Heartbeat collection failed: %s", e)


async def _has_open_bot_positions() -> bool:
    """Есть ли у какого-либо счёта открытые бот-позиции (по bot_open_tickets в БД)."""
    async with get_session() as session:
        try:
            result = await session.execute(
                select(AccountState.bot_open_tickets)
                .where(AccountState.is_running == True)  # noqa: E712
            )
            for (tickets_json,) in result.all():
                if tickets_json:
                    import json
                    try:
                        tickets = json.loads(tickets_json)
                        if tickets:
                            return True
                    except (json.JSONDecodeError, TypeError):
                        pass
        except Exception:
            pass
    return False


async def run_scheduler(interval_minutes: int = 5) -> None:
    """
    Бесконечный цикл планировщика.
    Первый тик — сразу при старте, затем каждые interval_minutes минут.
    Вне торговых сессий — раз в 15 мин.
    При открытой позиции — каждые 30 сек (быстрый трейлинг).
    Остановка по CancelledError (при shutdown приложения).
    """
    from backend.context.trading_sessions import get_session_info
    from datetime import datetime, timezone

    # Интервалы:
    # - Сразу после закрытия M15 свечи (первые 2 мин): 15 сек — лучший момент входа
    # - Остальное время в сессии: 2 мин — мониторинг
    # - С открытой позицией: 15 сек всегда — трейлинг + partial close
    # - Рынок закрыт + нет позиций: полная пауза
    candle_hot_sec = 15    # 15 сек: горячая зона после закрытия свечи
    active_sec = 120       # 2 мин: обычный мониторинг в сессии
    position_sec = 3       # 3 сек: агрессивный трейлинг, каждый pip
    quiet_sec = 900        # 15 мин: рынок закрыт
    hot_window_sec = 120   # первые 2 мин после закрытия M15 свечи = горячая зона

    logger.info(
        "Планировщик запущен: 15s (candle close) / 2min (active) / 15s (position) / off (closed)"
    )

    # Первый тик сразу
    await _tick()

    while True:
        try:
            session = get_session_info()
            if not session.allow_trading:
                if await _has_open_bot_positions():
                    await asyncio.sleep(position_sec)
                    await _tick()
                else:
                    await asyncio.sleep(quiet_sec)
                continue

            if await _has_open_bot_positions():
                interval = position_sec
            else:
                # Определяем: мы в горячей зоне (первые 2 мин после xx:00/xx:15/xx:30/xx:45)?
                now = datetime.now(timezone.utc)
                minutes_in_quarter = now.minute % 15
                seconds_since_candle = minutes_in_quarter * 60 + now.second
                if seconds_since_candle < hot_window_sec:
                    interval = candle_hot_sec  # 15 сек — свеча только закрылась, ловим сигнал
                else:
                    interval = active_sec  # 2 мин — ждём следующую свечу

            await asyncio.sleep(interval)
            await _tick()
        except asyncio.CancelledError:
            logger.info("Планировщик остановлен")
            break
        except Exception as e:
            logger.exception("scheduler: необработанная ошибка тика: %s", e)
            # Не останавливаемся — ждём следующего тика
