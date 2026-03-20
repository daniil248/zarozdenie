# Миграция на новый сервер

## Безопасность

- **Не храните пароли SSH в репозитории.** После настройки входа по ключу смените пароль root на новом сервере.
- Скрипты используют ключ `~/.ssh/id_ed25519_new_origin` (или `$env:SSH_KEY`).

## 1. Данные со старого сервера

На машине с Windows, из папки `zarozhdenie_kseniya`:

```powershell
$env:SOURCE_HOST = "185.111.106.188"   # при необходимости
.\scripts\backup-from-old-server.ps1
```

В `migration-data/` появятся `mom-backup-*.sql` и `uploads-backup-*.tgz`.

## 2. Новый сервер (92.51.44.138)

1. Установить Docker и Docker Compose, скопировать структуру `/home/surrogacy` (в т.ч. `docker-compose.prod.yml`, `.env`, образы или `docker compose build`).
2. Поднять стек: `docker compose -f docker-compose.prod.yml up -d` (или как у вас в проде).
3. Скопировать SSH-ключ на новый сервер:
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519_new_origin.pub root@92.51.44.138
   ```

## 3. Восстановление БД и uploads

```powershell
.\scripts\restore-on-new-server.ps1 `
  -SqlFile ".\migration-data\mom-backup-YYYYMMDD-HHMMSS.sql" `
  -UploadsTgz ".\migration-data\uploads-backup-YYYYMMDD-HHMMSS.tgz"
```

Переменная `$env:TARGET_HOST` при необходимости переопределяет IP.

## 4. Деплой кода

```powershell
.\deploy-web.ps1
```

По умолчанию цель — `92.51.44.138`. Старый сервер:  
`$env:DEPLOY_SERVER_IP = "185.111.106.188"`

## Если на старом сервере не хватало места (ENOSPC)

Освободите диск на **старом** сервере перед `pg_dump`/сборкой, затем повторите бэкап.

## Проверка, что данные перенеслись

На машине с ключом SSH:

```powershell
$env:VERIFY_HOST = "185.111.106.188"; .\scripts\verify-server-data.ps1   # старый
$env:VERIFY_HOST = "92.51.44.138";   .\scripts\verify-server-data.ps1   # новый
```

Сравните числа **Product / User / Order** и количество файлов в **uploads**.
