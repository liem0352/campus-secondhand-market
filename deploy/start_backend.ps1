# Start Django Backend with waitress-serve
# Port: 8000
# Usage: .\deploy\start_backend.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = 'Stop'

# ---------- Path Config ----------
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir '..')
$BackendDir  = Join-Path $ProjectRoot 'backend'

$PythonExe = 'C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe'
$Port      = 8000

Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Starting Django Backend (waitress)  ' -ForegroundColor Cyan
Write-Host "  Path: $BackendDir" -ForegroundColor Cyan
Write-Host "  Port: $Port" -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

# ---------- Check .env ----------
$EnvFile = Join-Path $BackendDir '.env'
if (-not (Test-Path $EnvFile)) {
    Write-Host '[WARN] .env not found, copying from .env.example ...' -ForegroundColor Yellow
    Copy-Item (Join-Path $BackendDir '.env.example') $EnvFile
    Write-Host '[INFO] .env generated, please edit DB_PASSWORD / LLM_API_KEY before starting' -ForegroundColor Yellow
}

# ---------- Check waitress ----------
$WaitressCheck = & $PythonExe -c "from importlib.metadata import version; print(version('waitress'))" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host '[STEP] waitress not found, installing ...' -ForegroundColor Yellow
    & $PythonExe -m pip install --upgrade waitress
    if ($LASTEXITCODE -ne 0) {
        Write-Host '[ERROR] waitress install failed, run: pip install waitress' -ForegroundColor Red
        exit 1
    }
}

# ---------- Start ----------
Set-Location $BackendDir
$env:PYTHONIOENCODING = 'utf-8'

# Check port
$PortInUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($PortInUse) {
    Write-Host "[WARN] Port $Port is in use (PID=$($PortInUse.OwningProcess)), run deploy\stop_all.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Start with waitress-serve
$LogDir = Join-Path $ProjectRoot 'logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
$LogFile = Join-Path $LogDir 'backend.log'

$Args = @(
    '-m', 'waitress'
    '--host=0.0.0.0'
    "--port=$Port"
    '--threads=4'
    'config.wsgi:application'
)

Write-Host '[START] waitress-serve config.wsgi:application' -ForegroundColor Green
Write-Host "[LOG] $LogFile" -ForegroundColor Green

$Proc = Start-Process -FilePath $PythonExe `
                       -ArgumentList $Args `
                       -WorkingDirectory $BackendDir `
                       -RedirectStandardOutput $LogFile `
                       -RedirectStandardError  (Join-Path $LogDir 'backend.err.log') `
                       -WindowStyle Hidden `
                       -PassThru

Write-Host ''
Write-Host "[Backend Started]  PID = $($Proc.Id)" -ForegroundColor Green
Write-Host "[URL]              http://127.0.0.1:$Port/" -ForegroundColor Green
Write-Host "[Health Check]     http://127.0.0.1:$Port/api/health/" -ForegroundColor Green
Write-Host "[Stop]             deploy\stop_all.ps1" -ForegroundColor Green
Write-Host ''