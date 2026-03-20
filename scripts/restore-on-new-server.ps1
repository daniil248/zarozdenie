# Восстанавливает дамп и uploads на НОВОМ сервере (после того же layout /home/surrogacy).
# Перед запуском: скопируйте SSH-ключ на новый сервер:
#   ssh-copy-id -i ~/.ssh/id_ed25519_new_origin.pub root@92.51.44.138
# Или задайте:
#   $env:TARGET_HOST = "92.51.44.138"
#   $env:SSH_KEY = "путь к ключу"
#
# Параметры:
#   -SqlFile    путь к mom-backup-....sql
#   -UploadsTgz путь к uploads-backup-....tgz

param(
    [Parameter(Mandatory = $true)][string]$SqlFile,
    [Parameter(Mandatory = $true)][string]$UploadsTgz,
    [string]$TargetHost = $env:TARGET_HOST
)

$ErrorActionPreference = "Stop"
if (-not $TargetHost) { $TargetHost = "92.51.44.138" }

$KeyPath = if ($env:SSH_KEY) { $env:SSH_KEY } else { Join-Path $HOME ".ssh\id_ed25519_new_origin" }
$Server = "root@$TargetHost"

if (-not (Test-Path -LiteralPath $SqlFile)) { Write-Error "Нет файла: $SqlFile" }
if (-not (Test-Path -LiteralPath $UploadsTgz)) { Write-Error "Нет файла: $UploadsTgz" }

Write-Host "Загрузка файлов на $TargetHost ..." -ForegroundColor Cyan
& scp -i $KeyPath -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new $SqlFile "${Server}:/tmp/mom-backup.sql"
& scp -i $KeyPath -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new $UploadsTgz "${Server}:/tmp/uploads-backup.tgz"

$restore = @'
set -e
cd /home/surrogacy || exit 1
COMPOSE="docker compose -f docker-compose.prod.yml"
PG_SVC=$($COMPOSE config --services 2>/dev/null | grep -E '^postgres$|^db$' | head -1)
[ -z "$PG_SVC" ] && PG_SVC=postgres
DBNAME=mom
$COMPOSE stop api 2>/dev/null || true
if ! $COMPOSE exec -T "$PG_SVC" psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DBNAME'" | grep -q 1; then
  $COMPOSE exec -T "$PG_SVC" psql -U postgres -c "CREATE DATABASE $DBNAME;"
fi
$COMPOSE exec -T "$PG_SVC" psql -U postgres -d "$DBNAME" < /tmp/mom-backup.sql
API_CID=$($COMPOSE ps -q api 2>/dev/null | head -1)
if [ -n "$API_CID" ]; then
  docker cp /tmp/uploads-backup.tgz "$API_CID":/tmp/uploads-backup.tgz
  docker exec "$API_CID" sh -c "cd /usr/src/app && rm -rf uploads && tar xzf /tmp/uploads-backup.tgz"
else
  mkdir -p /home/surrogacy/api
  tar xzf /tmp/uploads-backup.tgz -C /home/surrogacy/api
fi
$COMPOSE start api 2>/dev/null || $COMPOSE up -d api
echo RESTORE_OK
'@
Write-Host "Восстановление БД и uploads на сервере..." -ForegroundColor Cyan
$restore | & ssh -i $KeyPath -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new $Server "bash -s"

Write-Host "Готово." -ForegroundColor Green
