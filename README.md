# Зарождение — веб (Nuxt) + API (Nest) + PostgreSQL

Репозиторий: **https://github.com/daniil248/zarozdenie**

## GitHub Pages (статический фронт)

После включения **Settings → Pages → GitHub Actions** пуш в `main` собирает сайт:

**https://daniil248.github.io/zarozdenie/**

Подробности и CORS: [`docs/GITHUB-PAGES.md`](docs/GITHUB-PAGES.md)

## Деплой на VPS

- `deploy-web.ps1` — выкладка файлов на сервер.
- БД и `uploads`: [`docs/MIGRATION-SERVER.md`](docs/MIGRATION-SERVER.md), скрипты в `scripts/`.

## Проверка данных после миграции

```powershell
$env:VERIFY_HOST = "92.51.44.138"
.\scripts\verify-server-data.ps1
```

## Структура

- `web/` — Nuxt 3 (SPA)
- `api/` — NestJS + Prisma
