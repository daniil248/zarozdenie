# Снимает с ТЕКУЩЕГО прод-сервера: дамп PostgreSQL + архив uploads.
# Запуск из папки zarozhdenie_kseniya:
#   .\scripts\backup-from-old-server.ps1
# Переменные (опционально):
#   $env:SOURCE_HOST = "185.111.106.188"
#   $env:SSH_KEY     = полный путь к ключу (по умолчанию ~/.ssh/id_ed25519_new_origin)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $ProjectRoot "migration-data"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$SourceHost = if ($env:SOURCE_HOST) { $env:SOURCE_HOST } else { "185.111.106.188" }
$KeyPath = if ($env:SSH_KEY) { $env:SSH_KEY } else { Join-Path $HOME ".ssh\id_ed25519_new_origin" }
if (-not (Test-Path -LiteralPath $KeyPath)) {
    Write-Error "Нет ключа SSH: $KeyPath. Укажите `$env:SSH_KEY или положите ключ."
}
$Server = "root@$SourceHost"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$remoteScript = @'
set -e
cd /home/surrogacy || { echo "NO /home/surrogacy"; exit 1; }
COMPOSE="docker compose -f docker-compose.prod.yml"
PG_SVC=$($COMPOSE config --services 2>/dev/null | grep -E '^postgres$|^db$' | head -1)
if [ -z "$PG_SVC" ]; then PG_SVC=postgres; fi
echo "Using postgres service: $PG_SVC"
DBNAME=mom
$COMPOSE exec -T "$PG_SVC" pg_dump -U postgres --no-owner --no-acl "$DBNAME" > /tmp/mom-backup.sql

API_CID=$($COMPOSE ps -q api 2>/dev/null | head -1)
if [ -d /home/surrogacy/api/uploads ]; then
  tar czf /tmp/uploads-backup.tgz -C /home/surrogacy/api uploads
elif [ -n "$API_CID" ]; then
  docker exec "$API_CID" sh -c "cd /usr/src/app && tar czf - uploads" > /tmp/uploads-backup.tgz
else
  echo "WARNING: no uploads; empty tgz"
  mkdir -p /tmp/emptyuploads
  tar czf /tmp/uploads-backup.tgz -C /tmp/emptyuploads .
fi
ls -la /tmp/mom-backup.sql /tmp/uploads-backup.tgz
'@

Write-Host "=== Дамп на сервере $SourceHost ===" -ForegroundColor Cyan
$remoteScript | & ssh -i $KeyPath -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new $Server "bash -s"

Write-Host "=== Скачивание в $OutDir ===" -ForegroundColor Cyan
& scp -i $KeyPath -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "${Server}:/tmp/mom-backup.sql" (Join-Path $OutDir "mom-backup-$stamp.sql")
& scp -i $KeyPath -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "${Server}:/tmp/uploads-backup.tgz" (Join-Path $OutDir "uploads-backup-$stamp.tgz")

Write-Host "Готово. Файлы:" -ForegroundColor Green
Get-ChildItem $OutDir | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | Format-Table Name, Length, LastWriteTime
