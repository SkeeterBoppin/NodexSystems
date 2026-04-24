$ErrorActionPreference = "Stop"

$RepoRoot = "C:\Users\Zak\OneDrive\Desktop\Nodex System\Node"
$OllamaPort = 11434
$LmStudioPort = 1234

function Test-PortListening {
    param([int]$Port)

    $result = netstat -ano | Select-String ":$Port\s+.*LISTENING"
    return ($null -ne $result)
}

function Wait-ForPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 20
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        if (Test-PortListening -Port $Port) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }

    return $false
}

Write-Host ""
Write-Host "=== NODEX DEV BRING-UP ==="
Write-Host "Repo root: $RepoRoot"
Write-Host ""

Set-Location $RepoRoot

Write-Host "--- OLLAMA ---"
if (Test-PortListening -Port $OllamaPort) {
    Write-Host "Ollama already listening on port $OllamaPort"
} else {
    Write-Host "Starting Ollama server..."
    Start-Process powershell -ArgumentList @(
        '-NoExit',
        '-Command',
        'ollama serve'
    ) | Out-Null

    if (Wait-ForPort -Port $OllamaPort -TimeoutSeconds 20) {
        Write-Host "Ollama started on port $OllamaPort"
    } else {
        Write-Host "ERROR: Ollama did not open port $OllamaPort in time"
    }
}
Write-Host ""

Write-Host "--- LM STUDIO ---"
if (Test-PortListening -Port $LmStudioPort) {
    Write-Host "LM Studio server already listening on port $LmStudioPort"
} else {
    Write-Host "Starting LM Studio server..."
    Start-Process powershell -ArgumentList @(
        '-NoExit',
        '-Command',
        'lms server start --port 1234'
    ) | Out-Null

    if (Wait-ForPort -Port $LmStudioPort -TimeoutSeconds 20) {
        Write-Host "LM Studio server started on port $LmStudioPort"
    } else {
        Write-Host "ERROR: LM Studio did not open port $LmStudioPort in time"
    }
}
Write-Host ""

Write-Host "--- HEALTH CHECKS ---"
Write-Host ""
Write-Host "[ollama tags]"
try {
    curl.exe -s http://localhost:11434/api/tags
} catch {
    Write-Host "ERROR: Ollama health check failed"
}
Write-Host ""
Write-Host ""

Write-Host "[lm studio status]"
try {
    lms server status
} catch {
    Write-Host "ERROR: LM Studio health check failed"
}
Write-Host ""
Write-Host ""

Write-Host "[ports]"
netstat -ano | Select-String "11434|1234"
Write-Host ""
Write-Host "Bring-up complete."
