# Start Admin Panel Web Frontend (frontend-admin)
# Port: 5173
# Usage: .\deploy\start_frontend_admin.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = 'Stop'

# ---------- Path Config ----------
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir '..')
$FrontendDir = Join-Path $ProjectRoot 'frontend-admin'
$Port        = 5173

Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Starting Admin Panel (frontend-admin)  ' -ForegroundColor Cyan
Write-Host "  Path: $FrontendDir" -ForegroundColor Cyan
Write-Host "  Port: $Port" -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

# ---------- Check node_modules ----------
if (-not (Test-Path (Join-Path $FrontendDir 'node_modules'))) {
    Write-Host '[STEP] node_modules not found, running npm install ...' -ForegroundColor Yellow
    Set-Location $FrontendDir
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host '[ERROR] npm install failed' -ForegroundColor Red
        exit 1
    }
}

# ---------- Check Port ----------
$PortInUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($PortInUse) {
    Write-Host "[WARN] Port $Port is in use (PID=$($PortInUse.OwningProcess)), run deploy\stop_all.ps1 first" -ForegroundColor Yellow
    exit 1
}

# ---------- Start ----------
$LogDir = Join-Path $ProjectRoot 'logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
$LogFile = Join-Path $LogDir 'frontend-admin.log'

Set-Location $FrontendDir
$env:PYTHONIOENCODING = 'utf-8'

Write-Host '[START] npm run dev' -ForegroundColor Green
Write-Host "[LOG] $LogFile" -ForegroundColor Green

$Proc = Start-Process -FilePath 'npm.cmd' `
                       -ArgumentList 'run','dev' `
                       -WorkingDirectory $FrontendDir `
                       -RedirectStandardOutput $LogFile `
                       -RedirectStandardError  (Join-Path $LogDir 'frontend-admin.err.log') `
                       -WindowStyle Hidden `
                       -PassThru

Write-Host ''
Write-Host "[Admin Panel Started]  PID = $($Proc.Id)" -ForegroundColor Green
Write-Host "[URL]                  http://127.0.0.1:$Port/" -ForegroundColor Green
Write-Host "[API Proxy]            /api -> http://127.0.0.1:8000" -ForegroundColor Green
Write-Host ''