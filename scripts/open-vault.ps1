# scripts/open-vault.ps1
# Script tự động mở Obsidian trỏ thẳng vào Vault kiến thức của StudentHub-AI

$vaultPath = Resolve-Path (Join-Path $PSScriptRoot "..\docs\vault")
Write-Host "Opening StudentHub-AI Knowledge Vault at: $vaultPath" -ForegroundColor Cyan

# Encode path for obsidian:// URI
$encodedPath = [System.Uri]::EscapeDataString($vaultPath)
$obsidianUri = "obsidian://open?path=$encodedPath"

# Try opening via Obsidian URI protocol first
try {
    Start-Process $obsidianUri -ErrorAction Stop
    Write-Host "Obsidian Vault opened successfully via URI protocol!" -ForegroundColor Green
} catch {
    # Fallback to direct executable path
    $exePath = "$env:LOCALAPPDATA\Programs\Obsidian\Obsidian.exe"
    if (Test-Path $exePath) {
        Start-Process $exePath -ArgumentList "$vaultPath"
        Write-Host "Obsidian launched via $exePath" -ForegroundColor Green
    } else {
        Write-Warning "Could not automatically launch Obsidian. Please open Obsidian and select folder: $vaultPath"
    }
}
