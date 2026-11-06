$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

function Wait-Docker {
    $deadline = (Get-Date).AddMinutes(4)
    do {
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return
        }
        Start-Sleep -Seconds 3
    } while ((Get-Date) -lt $deadline)
    throw "Docker Desktop did not start. Open Docker Desktop and wait until it says Running, then run this script again."
}

Write-Host "Starting Docker Desktop..."
$dockerDesktop = @(
    "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe",
    "$env:LOCALAPPDATA\Programs\DockerDesktop\frontend\Docker Desktop.exe",
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $dockerDesktop) {
    throw "Docker Desktop is not installed."
}

$dockerRunning = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dockerRunning) {
    Start-Process $dockerDesktop
}

Wait-Docker
Write-Host "Docker is ready."

Write-Host "Starting hospital app on http://localhost:5000 ..."
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw "App compose failed" }

Write-Host "Starting Jenkins on http://localhost:8080 ..."
docker compose -f docker-compose.jenkins.yml up -d --build
if ($LASTEXITCODE -ne 0) { throw "Jenkins compose failed" }

Write-Host "Waiting for Jenkins..."
$deadline = (Get-Date).AddMinutes(5)
do {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8081/login" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -ge 200) { break }
    } catch {
        Start-Sleep -Seconds 5
    }
} while ((Get-Date) -lt $deadline)

Write-Host ""
Write-Host "App:     http://localhost:5000"
Write-Host "Jenkins: http://localhost:8081"
Write-Host "Login:   admin / admin123"
Write-Host "Job:     hospital-booking  (click Build Now)"
Write-Host ""
docker compose ps
docker compose -f docker-compose.jenkins.yml ps
