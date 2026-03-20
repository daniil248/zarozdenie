# Зарождение — веб (Nuxt) + API (Nest) + PostgreSQL

## Деплой на VPS

- Скрипт выкладки файлов: `deploy-web.ps1` (цель по умолчанию в скрипте).
- Полный перенос БД и `uploads`: `docs/MIGRATION-SERVER.md`, скрипты в `scripts/`.

## Проверка данных после миграции

```powershell
$env:VERIFY_HOST = "92.51.44.138"   # или старый сервер для сравнения
.\scripts\verify-server-data.ps1
```

Считаются записи в таблицах `Product`, `User`, `Order` и число файлов в `uploads`.

## Тестовый фронт на GitHub Pages

Инструкция: [`docs/GITHUB-PAGES.md`](docs/GITHUB-PAGES.md) — только статическая сборка Nuxt; API остаётся на сервере.

## Структура

- `web/` — Nuxt 3 (SPA, `ssr: false`)
- `api/` — NestJS + Prisma
