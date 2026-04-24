$ErrorActionPreference = "Stop"

$RepoRoot = $PSScriptRoot
$StartScript = Join-Path $RepoRoot "start_nodex_dev.ps1"

Write-Host ""
Write-Host "=== NODEX RUN ==="
Write-Host "Repo root: $RepoRoot"
Write-Host ""

if (-not (Test-Path $StartScript)) {
    throw "Missing required file: $StartScript"
}

Write-Host "--- DEV BRING-UP ---"
powershell.exe -ExecutionPolicy Bypass -File $StartScript

if ($LASTEXITCODE -ne 0) {
    throw "start_nodex_dev.ps1 failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "--- EVOLVE ---"
Set-Location $RepoRoot
node .\evolve.js

if ($LASTEXITCODE -ne 0) {
    throw "evolve.js failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "Nodex run complete."
