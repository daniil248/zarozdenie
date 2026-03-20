# Считает на удалённом сервере (через SSH + docker compose): строки в БД и файлы в uploads.
# Сравните вывод до/после миграции или со старым и новым хостом.
#
# Примеры:
#   .\scripts\verify-server-data.ps1
#   $env:VERIFY_HOST = "92.51.44.138"; .\scripts\verify-server-data.ps1

$ErrorActionPreference = "Stop"
$HostIp = if ($env:VERIFY_HOST) { $env:VERIFY_HOST } else { "92.51.44.138" }
$KeyPath = if ($env:SSH_KEY) { $env:SSH_KEY } else { Join-Path $HOME ".ssh\id_ed25519_new_origin" }
if (-not (Test-Path -LiteralPath $KeyPath)) {
    Write-Error "Нет ключа SSH: $KeyPath"
}
$Server = "root@$HostIp"

$remote = @'
set -e
cd /home/surrogacy || { echo "ERR_NO_SURROGACY_DIR"; exit 1; }
COMPOSE="docker compose -f docker-compose.prod.yml"
PG_SVC=$($COMPOSE config --services 2>/dev/null | grep -E '^postgres$|^db$' | head -1)
[ -z "$PG_SVC" ] && PG_SVC=postgres
DBNAME=mom
echo "=== DB $DBNAME @ $(hostname) ==="
for TABLE in Product User Order; do
  N=$($COMPOSE exec -T "$PG_SVC" psql -U postgres -d "$DBNAME" -t -A -c "SELECT count(*) FROM \"$TABLE\";" 2>/dev/null || echo "?")
  echo "  $TABLE: $N"
done
echo "=== uploads (files) ==="
API_CID=$($COMPOSE ps -q api 2>/dev/null | head -1)
if [ -d /home/surrogacy/api/uploads ]; then
  echo "  host: $(find /home/surrogacy/api/uploads -type f 2>/dev/null | wc -l)"
elif [ -n "$API_CID" ]; then
  echo "  container api: $(docker exec "$API_CID" find /usr/src/app/uploads -type f 2>/dev/null | wc -l)"
else
  echo "  (uploads not found)"
fi
echo "=== done ==="
'@

Write-Host "Проверка: $Server" -ForegroundColor Cyan
$remote | & ssh -i $KeyPath -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new $Server "bash -s"
