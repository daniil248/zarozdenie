# Сайт на GitHub Pages (тестовый домен)

Репозиторий [daniil248/zarozdenie](https://github.com/daniil248/zarozdenie) сейчас — **статический** лендинг (HTML/CSS). Этот проект — **Nuxt + API + PostgreSQL**. GitHub Pages отдаёт **только статику**; API и база должны быть на **вашем сервере**.

## Что сделать вам (доступ к GitHub у ассистента нет)

1. **Скопировать код** этого каталога `zarozhdenie_kseniya` в репозиторий `zarozdenie` (или сделать новый репозиторий и залить сюда весь монорепозиторий).
2. В GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. В **Settings → Secrets and variables → Actions** добавить секреты:

   | Secret | Пример |
   |--------|--------|
   | `NUXT_PUBLIC_API` | `https://ваш-тестовый-домен.kz/api` или URL API на `92.51.44.138` за HTTPS |
   | `NUXT_PUBLIC_IMAGE` | `https://ваш-тестовый-домен.kz/` (база для картинок) |
   | `NUXT_APP_BASE_URL` | Для адреса `https://daniil248.github.io/zarozdenie/` укажите **`/zarozdenie/`** (со слэшами). Для корня домена оставьте пустым или не задавайте. |

4. Запушить в `main` — сработает workflow `.github/workflows/github-pages.yml`.

Сайт будет по адресу вида: `https://daniil248.github.io/zarozdenie/` (если задан `NUXT_APP_BASE_URL=/zarozdenie/`).

## CORS

Фронт на `github.io` ходит к API на другом домене. На сервере в `.env` API задайте, например:

```env
CORS_ORIGIN=https://daniil248.github.io
```

Если нужно несколько источников — позже можно расширить `main.ts` (массив `origin`).

## Локальная сборка статики (проверка без GitHub)

```powershell
cd web
$env:NUXT_PUBLIC_API="https://ваш-api/api"
$env:NUXT_PUBLIC_IMAGE="https://ваш-сайт/"
$env:NUXT_APP_BASE_URL="/zarozdenie/"
npm run generate
# результат: web\.output\public
```

## Проверка, что данные на сервере совпадают

См. `scripts/verify-server-data.ps1` и `docs/MIGRATION-SERVER.md`. Сравните вывод для старого и нового IP.
