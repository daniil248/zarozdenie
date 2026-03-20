# GitHub Pages (фронт)

Сайт после деплоя: **https://daniil248.github.io/zarozdenie/**

Фронт ходит к API по адресам из `nuxt.config` (по умолчанию `https://new-origin.kz/...`) или из **Secrets** (если заданы).

## Включить публикацию (один раз)

1. Репозиторий → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**

После пуша в `main` запускается `.github/workflows/github-pages.yml`.

## Секреты (необязательно)

**Settings → Secrets and variables → Actions** — если нужно не дефолтное API:

| Secret | Назначение |
|--------|------------|
| `NUXT_PUBLIC_API` | URL API с `/api`, напр. `https://ваш-домен/api` |
| `NUXT_PUBLIC_IMAGE` | Базовый URL картинок, напр. `https://ваш-домен/` |

`NUXT_APP_BASE_URL` и `NUXT_PUBLIC_SITE_URL` для Pages **зашиты в workflow** под репозиторий `zarozdenie`.

## CORS на API

Для запросов с `github.io` в `.env` бэкенда:

```env
CORS_ORIGIN=https://daniil248.github.io
```

## Локальная проверка сборки

```powershell
cd web
$env:NUXT_APP_BASE_URL="/zarozdenie/"
$env:NUXT_PUBLIC_SITE_URL="https://daniil248.github.io/zarozdenie"
npm ci
npx nuxi generate
# результат: .output\public
```
