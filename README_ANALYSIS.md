# Анализ проекта zarozhdenie_kseniya (new-origin / surrogacy)

Скачано: **web** (Nuxt 3) полностью, **api** (NestJS + Prisma) полностью; папка `api/uploads` не скопировалась из‑за имён файлов с двоеточием на Windows (на сервере всё на месте).

**Уже исправлено:** ValidationPipe whitelist, CORS из env, имена файлов без `:`, порядок роутов product (filters/get выше :id), api.ts useAlertStore, убран console.log в catch, env.example и web env.example, API/IMAGE из env во фронте.

---

## Как устроено

- **Фронт:** Nuxt 3, Pinia, i18n (ru/en), FormKit, Swiper. SSR выключен (`ssr: false`).
- **Бэкенд:** NestJS 10, Prisma (PostgreSQL), JWT, argon2, загрузка файлов (sharp → webp), Telegram-бот (уведомления).
- **Суть:** анкеты (Product) с фото и полями, пользователи (User), заявки (Order). Роли: USER, ADMIN. Пользователь с `status: false` не может смотреть каталог (IsActiveGuard).

---

## Проблемы и слабые места

### 1. Безопасность

| Что | Где | Рекомендация |
|-----|-----|--------------|
| **Слабый JWT secret** | `env.example`: `SECRET=TEMEK` | В проде обязательно длинный случайный `SECRET` (32+ символа). |
| **ValidationPipe whitelist: false** | `main.ts` | Включить `whitelist: true`, чтобы отбрасывать лишние поля в DTO (защита от mass assignment). |
| **CORS полностью открыт** | `app.enableCors()` без опций | Задать `origin`: домен фронта (например `https://new-origin.kz`). |
| **Нет rate limit** | Везде | Добавить `@nestjs/throttler` на auth и на публичный `POST /product` (защита от брутфорса и спама анкет). |
| **Пароль в логах при ошибке** | Не видно явно, но `console.log(e)` в file.service | Не логировать тело запроса/файлы; в проде убрать или заменить на структурированный логгер. |

### 2. Конфиг и окружение

| Что | Где | Рекомендация |
|-----|-----|--------------|
| **API и image зашиты в коде** | `nuxt.config.ts`: `api: 'https://new-origin.kz/api'`, `image: 'https://new-origin.kz/'` | Вынести в `runtimeConfig` из env (например `NUXT_PUBLIC_API_BASE`, `NUXT_PUBLIC_IMAGE_BASE`), чтобы один билд работал и для теста, и для прода. |
| **Нет .env для web** | В web нет env.example | Добавить пример (или описать в README) переменные для API URL и, при необходимости, отдельного домена картинок. |

### 3. Загрузка файлов (api)

| Что | Где | Рекомендация |
|-----|-----|--------------|
| **Имена с двоеточием** | `file.service.ts`: `fileName = \`${hours}:${minutes}:${seconds}-...\`` | На Windows такие пути не создаются. Заменить на `HH-mm-ss` или `HHmmss`, чтобы кросс-платформенно и без проблем при скачивании на Windows. |
| **Раздача uploads** | `ServeStaticModule` с `rootPath: join(__dirname, '..')`, `renderPath: 'uploads'` | Проверить, что нет path traversal (типа `/uploads/../../../etc/passwd`). В Nest/Express статика обычно резолвится безопасно, но явно не отдавать файлы вне папки `uploads`. |
| **Типы картинок** | CreateProductDto: только `image/jpeg`, `image/png` | Нормально; webp на вход не принимается — конвертация в webp на бэке ок. |

### 4. API и роутинг

| Что | Где | Рекомендация |
|-----|-----|--------------|
| **Публичное создание анкеты** | `POST /product` без guards | Похоже на задумку (форма для всех). Обязательно добавить rate limit и, при необходимости, капчу/антиспам. |
| **Роут `Get('admin/product')`** | product.controller: `findAllAdmin` на `Get('admin/product')` | В Nest порядок регистрации маршрутов важен: более специфичный `admin/product` может перехватываться как `:id` с `id=admin`. Проверить порядок роутов (более специфичные — выше) или вынести админские методы в отдельный контроллер с префиксом. |
| **JWT без refresh-ротации** | user.service генерит access + refresh | Уточнить, делается ли инвалидация refresh при выходе; если нет — хранить blacklist или версию в БД. |

### 5. Фронт

| Что | Где | Рекомендация |
|-----|-----|--------------|
| **localStorage в composable** | `api.ts`: `localStorage.getItem('lang')` | На SSR это падает (у тебя ssr: false — ок). При включении SSR использовать только в `onMounted` или `useState`/cookie. |
| **Ошибка в useApi** | `useAlert('Server error', true)` | Скорее всего должно быть `useAlertStore().init(...)`. Исправить, чтобы при 500 показывалось уведомление. |
| **Версии пакетов** | package.json: `@nuxt/devtools: "latest"` и т.д. | Зафиксировать версии (убрать `latest`), чтобы билд воспроизводился. |

### 6. БД и миграции

| Что | Где | Рекомендация |
|-----|-----|--------------|
| **Миграции** | prisma/migrations есть (init, add_ganorar) | Перед деплоем на новое окружение: `prisma migrate deploy`. Не забыть задать `DATABASE_URL` в .env на сервере. |
| **Резервные копии** | Не видно | Настроить периодический бэкап PostgreSQL (cron + pg_dump или снимки VDS). |

### 7. Деплой

| Что | Где | Рекомендация |
|-----|-----|--------------|
| **Docker** | На сервере есть docker-compose, в репозитории — Dockerfile в web и api | Проверить, что в проде не поднимается с дефолтными env (SECRET, DATABASE_URL). Использовать .env или секреты оркестратора. |
| **Порт API** | main.ts: `listen(3001)` | Совпадает с тем, что ожидает фронт/прокси (nginx и т.д.). Настроить nginx proxy на 3001 или тот порт, который реально слушает приложение. |

---

## Что доработать в первую очередь

1. **Секреты и CORS:** поменять `SECRET`, включить `whitelist: true`, ограничить CORS.
2. **Rate limit:** на логин/регистрацию и на `POST /api/product`.
3. **Фронт:** API/base URL из env; исправить вызов `useAlert` в `api.ts`.
4. **Имена файлов:** убрать двоеточия в имени (часы-минуты-секунды в формате без `:`).
5. **Роуты продукта:** убедиться, что `GET admin/product` не обрабатывается как `GET :id`.
6. **Документация:** в корне или в README описать, какие env нужны для api и web, как запускать локально и как деплоить (docker-compose, порты, nginx).

После этого можно выносить конфиг в env, добавлять логирование и мониторинг по необходимости.
