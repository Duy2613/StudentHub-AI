# scripts/register-obsidian-vault.ps1
# Tự động đăng ký và liên kết StudentHub-AI Vault vào ứng dụng Obsidian

$appDataObsidian = Join-Path $env:APPDATA "obsidian"
$obsidianJson = Join-Path $appDataObsidian "obsidian.json"
$vaultPath = (Resolve-Path (Join-Path $PSScriptRoot "..\docs\vault")).Path

Write-Host "=== TÍCH HỢP OBSIDIAN KNOWLEDGE VAULT ===" -ForegroundColor Cyan
Write-Host "Vault Path: $vaultPath" -ForegroundColor Yellow

if (-not (Test-Path $appDataObsidian)) {
    New-Item -ItemType Directory -Path $appDataObsidian -Force | Out-Null
}

$config = @{ vaults = @{} }
if (Test-Path $obsidianJson) {
    try {
        $raw = Get-Content $obsidianJson -Raw
        $parsed = $raw | ConvertFrom-Json
        if ($parsed.vaults) {
            # Convert PSCustomObject to hashtable
            foreach ($prop in $parsed.vaults.PSObject.Properties) {
                $config.vaults[$prop.Name] = @{
                    path = $prop.Value.path
                    ts   = $prop.Value.ts
                    open = $false
                }
            }
        }
    } catch {
        Write-Warning "Could not parse existing obsidian.json, creating clean config."
    }
}

# Generate 16-hex deterministic Vault ID
$md5 = [System.Security.Cryptography.MD5]::Create()
$bytes = [System.Text.Encoding]::UTF8.GetBytes($vaultPath.ToLower())
$hash = ($md5.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") }) -join ""
$vaultId = $hash.Substring(0, 16)

$config.vaults[$vaultId] = @{
    path = $vaultPath
    ts   = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    open = $true
}

$jsonOutput = $config | ConvertTo-Json -Depth 5
Set-Content -Path $obsidianJson -Value $jsonOutput -Encoding UTF8
Write-Host "Da dang ky thanh cong Vault ID: $vaultId vao $obsidianJson" -ForegroundColor Green

# Kill existing Obsidian instance if running to reload config, then launch
$runningObsidian = Get-Process -Name "Obsidian" -ErrorAction SilentlyContinue
if ($runningObsidian) {
    Write-Host "Dang khoi dong lai Obsidian de cap nhat Vault..." -ForegroundColor Cyan
    Stop-Process -Name "Obsidian" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Open Vault directly via URI protocol
$encodedPath = [System.Uri]::EscapeDataString($vaultPath)
$obsidianUri = "obsidian://open?path=$encodedPath"

try {
    Start-Process $obsidianUri -ErrorAction Stop
    Write-Host "Da mo thanh cong Obsidian voi Vault StudentHub-AI!" -ForegroundColor Green
} catch {
    $exePath = "$env:LOCALAPPDATA\Programs\Obsidian\Obsidian.exe"
    if (Test-Path $exePath) {
        Start-Process $exePath -ArgumentList "$vaultPath"
        Write-Host "Da khoi dong Obsidian tu $exePath!" -ForegroundColor Green
    }
}
