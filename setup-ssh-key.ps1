param(
    [string]$HostName = "server.new-origin.kz",
    [string]$HostIp = "185.111.106.188",
    [string]$UserName = "root",
    [string]$KeyName = "id_ed25519_new_origin",
    [switch]$DisablePasswordAuth
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Command '$Name' not found. Install OpenSSH client first."
    }
}

Write-Host "== SSH key setup started ==" -ForegroundColor Cyan

Require-Command "ssh"
Require-Command "ssh-keygen"

$sshDir = Join-Path $HOME ".ssh"
if (-not (Test-Path $sshDir)) {
    New-Item -Path $sshDir -ItemType Directory | Out-Null
}

$privateKeyPath = Join-Path $sshDir $KeyName
$publicKeyPath = "${privateKeyPath}.pub"

if (-not (Test-Path $privateKeyPath)) {
    Write-Host "Generating new key: $privateKeyPath" -ForegroundColor Yellow
    ssh-keygen -t ed25519 -a 64 -C "$UserName@$HostName" -f $privateKeyPath
} else {
    Write-Host "Key already exists: $privateKeyPath" -ForegroundColor Yellow
}

if (-not (Test-Path $publicKeyPath)) {
    throw "Public key not found: $publicKeyPath"
}

# Load key into ssh-agent if service exists.
try {
    $svc = Get-Service -Name "ssh-agent" -ErrorAction Stop
    if ($svc.Status -ne "Running") {
        Set-Service -Name "ssh-agent" -StartupType Automatic
        Start-Service -Name "ssh-agent"
    }
    ssh-add $privateKeyPath | Out-Null
    Write-Host "Key loaded into ssh-agent." -ForegroundColor Green
} catch {
    Write-Host "ssh-agent service not available. Continuing without agent." -ForegroundColor DarkYellow
}

$configPath = Join-Path $sshDir "config"
$configBlock = @"
Host new-origin
    HostName $HostIp
    User $UserName
    IdentityFile $privateKeyPath
    IdentitiesOnly yes
    ServerAliveInterval 30
    ServerAliveCountMax 6

"@

if (Test-Path $configPath) {
    $existing = Get-Content $configPath -Raw
    if ($existing -notmatch "(?ms)^Host\s+new-origin\s*$") {
        Add-Content -Path $configPath -Value $configBlock
        Write-Host "Added host alias to $configPath" -ForegroundColor Green
    } else {
        Write-Host "Host alias 'new-origin' already exists in $configPath" -ForegroundColor Yellow
    }
} else {
    Set-Content -Path $configPath -Value $configBlock
    Write-Host "Created SSH config: $configPath" -ForegroundColor Green
}

# Upload public key to server.
Write-Host ""
Write-Host "You will be asked for server password once to install the key." -ForegroundColor Cyan
$remoteInstallCmd = @"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
cat >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
"@

Get-Content $publicKeyPath | ssh "$UserName@$HostIp" $remoteInstallCmd

Write-Host ""
Write-Host "Testing key-based login..." -ForegroundColor Cyan
ssh -i $privateKeyPath -o IdentitiesOnly=yes -o PasswordAuthentication=no -o BatchMode=yes "$UserName@$HostIp" "echo 'SSH key auth OK on $(hostname)'"

if ($DisablePasswordAuth) {
    Write-Host ""
    Write-Host "Disabling password auth in sshd_config..." -ForegroundColor Yellow
    $hardeningCmd = @"
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%F-%H%M%S)
sed -i 's/^[#[:space:]]*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^[#[:space:]]*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
if ! grep -q '^PasswordAuthentication' /etc/ssh/sshd_config; then echo 'PasswordAuthentication no' >> /etc/ssh/sshd_config; fi
if ! grep -q '^PubkeyAuthentication' /etc/ssh/sshd_config; then echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config; fi
systemctl restart sshd || systemctl restart ssh
"@
    ssh "new-origin" $hardeningCmd
    Write-Host "Password authentication disabled." -ForegroundColor Green
}

Write-Host ""
Write-Host "Done. Connect with: ssh new-origin" -ForegroundColor Green
Write-Host "Recommended: change root password after this setup." -ForegroundColor DarkYellow
