# Deploy web + api (по умолчанию новый сервер миграции)
# Запуск: .\deploy-web.ps1
# Старый IP при необходимости: $env:DEPLOY_SERVER_IP = "185.111.106.188"

$ErrorActionPreference = "Stop"
$ServerIp = if ($env:DEPLOY_SERVER_IP) { $env:DEPLOY_SERVER_IP } else { "92.51.44.138" }
$Server = "root@$ServerIp"
$KeyPath = Join-Path $HOME ".ssh\id_ed25519_new_origin"
$SshOpts = "-i `"$KeyPath`" -o IdentitiesOnly=yes"
$ProjectRoot = $PSScriptRoot
$WebDir = Join-Path $ProjectRoot "web"
$ApiDir = Join-Path $ProjectRoot "api"
$ProfileIdVue = Join-Path $WebDir 'pages\profiles\[id].vue'

Write-Host "1. Upload web files..." -ForegroundColor Cyan
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "nuxt.config.ts"))`" `"${Server}:/tmp/nuxt.config.ts`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "composables\useLocaleAnchor.ts"))`" `"${Server}:/tmp/useLocaleAnchor.ts`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "composables\api.ts"))`" `"${Server}:/tmp/composables-api.ts`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "composables\redirect.ts"))`" `"${Server}:/tmp/composables-redirect.ts`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "lang\ru-RU.json"))`" `"${Server}:/tmp/ru-RU.json`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "lang\en-US.json"))`" `"${Server}:/tmp/en-US.json`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "lang\zh-CN.json"))`" `"${Server}:/tmp/zh-CN.json`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "store\user.ts"))`" `"${Server}:/tmp/store-user.ts`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "components\auth\login.vue"))`" `"${Server}:/tmp/auth-login.vue`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "assets\styles\includes\login.scss"))`" `"${Server}:/tmp/login.scss`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "components\BackgroundDots.vue"))`" `"${Server}:/tmp/BackgroundDots.vue`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "components\TheHeader.vue"))`" `"${Server}:/tmp/TheHeader.vue`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "components\TheFooter.vue"))`" `"${Server}:/tmp/TheFooter.vue`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "components\TheLogo.vue"))`" `"${Server}:/tmp/TheLogo.vue`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "public\logo-header-white.svg"))`" `"${Server}:/tmp/logo-header-white.svg`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "assets\styles\general.scss"))`" `"${Server}:/tmp/general.scss`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "assets\styles\includes\intro.scss"))`" `"${Server}:/tmp/intro.scss`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "assets\styles\includes\header.scss"))`" `"${Server}:/tmp/header.scss`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "pages\index.vue"))`" `"${Server}:/tmp/index.vue`""
Invoke-Expression "scp $SshOpts `"$ProfileIdVue`" `"${Server}:/tmp/profile-id.vue`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "components\profile\List.vue"))`" `"${Server}:/tmp/profile-list.vue`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $WebDir "interfaces\IFilters.ts"))`" `"${Server}:/tmp/IFilters.ts`""

Write-Host "2. Upload api files..." -ForegroundColor Cyan
Invoke-Expression "scp $SshOpts `"$((Join-Path $ApiDir "src\product\product.service.ts"))`" `"${Server}:/tmp/product.service.ts`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $ApiDir "src\product\product.controller.ts"))`" `"${Server}:/tmp/product.controller.ts`""
Invoke-Expression "scp $SshOpts `"$((Join-Path $ApiDir "src\i18n\ru\global.json"))`" `"${Server}:/tmp/global-ru.json`""

Write-Host "3. Copy and rebuild on server..." -ForegroundColor Cyan
$bash = @'
cp /tmp/nuxt.config.ts /home/surrogacy/web/nuxt.config.ts && mkdir -p /home/surrogacy/web/composables /home/surrogacy/web/lang /home/surrogacy/web/pages/profiles /home/surrogacy/web/store /home/surrogacy/web/components/auth && cp /tmp/useLocaleAnchor.ts /home/surrogacy/web/composables/useLocaleAnchor.ts && cp /tmp/composables-api.ts /home/surrogacy/web/composables/api.ts && cp /tmp/composables-redirect.ts /home/surrogacy/web/composables/redirect.ts && cp /tmp/ru-RU.json /home/surrogacy/web/lang/ru-RU.json && cp /tmp/en-US.json /home/surrogacy/web/lang/en-US.json && cp /tmp/zh-CN.json /home/surrogacy/web/lang/zh-CN.json && cp /tmp/store-user.ts /home/surrogacy/web/store/user.ts && cp /tmp/auth-login.vue /home/surrogacy/web/components/auth/login.vue && cp /tmp/login.scss /home/surrogacy/web/assets/styles/includes/login.scss && cp /tmp/BackgroundDots.vue /home/surrogacy/web/components/ && cp /tmp/TheHeader.vue /home/surrogacy/web/components/ && cp /tmp/TheFooter.vue /home/surrogacy/web/components/ && cp /tmp/TheLogo.vue /home/surrogacy/web/components/ && mkdir -p /home/surrogacy/web/public /home/surrogacy/web/pages && cp /tmp/logo-header-white.svg /home/surrogacy/web/public/logo-header-white.svg && cp /tmp/general.scss /home/surrogacy/web/assets/styles/ && cp /tmp/intro.scss /home/surrogacy/web/assets/styles/includes/ && cp /tmp/header.scss /home/surrogacy/web/assets/styles/includes/ && cp /tmp/index.vue /home/surrogacy/web/pages/index.vue && mkdir -p /home/surrogacy/web/pages/profiles && cp /tmp/profile-id.vue "/home/surrogacy/web/pages/profiles/[id].vue" && cp /tmp/profile-list.vue /home/surrogacy/web/components/profile/List.vue && cp /tmp/IFilters.ts /home/surrogacy/web/interfaces/IFilters.ts && cp /tmp/product.service.ts /home/surrogacy/api/src/product/ && cp /tmp/product.controller.ts /home/surrogacy/api/src/product/ && cp /tmp/global-ru.json /home/surrogacy/api/src/i18n/ru/global.json && cd /home/surrogacy && docker compose -f docker-compose.prod.yml build web api --no-cache && docker compose -f docker-compose.prod.yml up -d web api
'@
$bashOneLine = $bash.Replace("`n", "").Replace("`r", "")
Invoke-Expression "ssh $SshOpts $Server `"bash -lc '$bashOneLine'`""

Write-Host "Done." -ForegroundColor Green
