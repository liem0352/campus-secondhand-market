# -*- coding: utf-8 -*-
# Integrated training - one-click restart script (fix edition)
# Backend 8000 (waitress) + Seller Console 3000 (vite) + Admin Console 5173 (vite)
# Usage in PowerShell:   .\deploy\restart_all.ps1

# Force file to be read as UTF-8 (PowerShell 5.1 default is ANSI, hence the mojibake)
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding          = [System.Text.Encoding]::UTF8
$ErrorActionPreference    = 'Continue'

# Locate script directory automatically (no hard-coded Chinese path)
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$BackendDir  = Join-Path $ProjectRoot 'backend'
$WebDir      = Join-Path $ProjectRoot 'frontend-web'
$AdminDir    = Join-Path $ProjectRoot 'frontend-admin'
$LogDir      = Join-Path $ProjectRoot 'logs'
$PythonExe   = 'C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe'

# Port definitions
$BackendPort = 8000
$WebPort     = 3000
$AdminPort   = 5173

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

function Out-Line {
    param([string]$Text, [string]$Color = 'White')
    $c = [System.ConsoleColor]::$Color
    [Console]::WriteLine($Text)
}

function Stop-Port {
    param([int]$Port, [string]$Label)
    $Conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($C in $Conns) {
        $Pid = $C.OwningProcess
        if ($Pid) {
            Out-Line ("[stop] " + $Label + " port " + $Port + " -> PID " + $Pid) 'Yellow'
            Stop-Process -Id $Pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 1
}

function Wait-Port {
    param([int]$Port, [int]$TimeoutSec = 30)
    for ($i = 0; $i -lt $TimeoutSec; $i++) {
        $L = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($L) { return $L.OwningProcess }
        Start-Sleep -Seconds 1
    }
    return $null
}

Out-Line '========================================' 'Cyan'
Out-Line '  Step 1/5  Stop existing services'     'Cyan'
Out-Line '========================================' 'Cyan'
Stop-Port $BackendPort 'backend'
Stop-Port $WebPort     'seller-web'
Stop-Port $AdminPort   'admin'

# Fallback: kill orphan waitress / vite processes
Get-Process -Name 'python','node' -ErrorAction SilentlyContinue | ForEach-Object {
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    if ($cmd -like '*waitress*' -or $cmd -like '*config.wsgi*' `
        -or $cmd -like '*frontend-web*' -or $cmd -like '*frontend-admin*' `
        -or $cmd -like '*vite*') {
        Out-Line ("[fallback] kill PID " + $_.Id + " : " + $cmd.Substring(0, [Math]::Min(80, $cmd.Length))) 'Yellow'
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2

Out-Line '========================================' 'Cyan'
Out-Line '  Step 2/5  Start backend Django (8000)' 'Cyan'
Out-Line '========================================' 'Cyan'
Set-Location $BackendDir
$env:PYTHONIOENCODING = 'utf-8'
$BackendLog = Join-Path $LogDir 'backend.log'
$BackendErr = Join-Path $LogDir 'backend.err.log'
$BackendProc = Start-Process -FilePath $PythonExe `
    -ArgumentList @('-m','waitress','--host=0.0.0.0','--port=8000','--threads=4','config.wsgi:application') `
    -WorkingDirectory $BackendDir `
    -RedirectStandardOutput $BackendLog `
    -RedirectStandardError $BackendErr `
    -WindowStyle Hidden -PassThru
Out-Line ("  backend PID = " + $BackendProc.Id) 'Green'

Out-Line '========================================' 'Cyan'
Out-Line '  Step 3/5  Start seller web (3000)'    'Cyan'
Out-Line '========================================' 'Cyan'
$WebLog = Join-Path $LogDir 'frontend-web.log'
$WebErr = Join-Path $LogDir 'frontend-web.err.log'
# Use vite.js directly to avoid npm.cmd being reaped under hidden window
$ViteJsWeb = Join-Path $WebDir 'node_modules\vite\bin\vite.js'
$WebProc = Start-Process -FilePath 'node.exe' `
    -ArgumentList "`"$ViteJsWeb`"" `
    -WorkingDirectory $WebDir `
    -RedirectStandardOutput $WebLog `
    -RedirectStandardError $WebErr `
    -WindowStyle Hidden -PassThru
Out-Line ("  seller-web PID = " + $WebProc.Id) 'Green'

Out-Line '========================================' 'Cyan'
Out-Line '  Step 4/5  Start admin web (5173)'     'Cyan'
Out-Line '========================================' 'Cyan'
$AdminLog = Join-Path $LogDir 'frontend-admin.log'
$AdminErr = Join-Path $LogDir 'frontend-admin.err.log'
$ViteJsAdmin = Join-Path $AdminDir 'node_modules\vite\bin\vite.js'
$AdminProc = Start-Process -FilePath 'node.exe' `
    -ArgumentList "`"$ViteJsAdmin`"" `
    -WorkingDirectory $AdminDir `
    -RedirectStandardOutput $AdminLog `
    -RedirectStandardError $AdminErr `
    -WindowStyle Hidden -PassThru
Out-Line ("  admin-web PID = " + $AdminProc.Id) 'Green'

Out-Line '========================================' 'Cyan'
Out-Line '  Step 5/5  Wait for ports'             'Cyan'
Out-Line '========================================' 'Cyan'

$BackendPid = Wait-Port $BackendPort 25
$msg1 = "  [OK]   backend    8000  PID=" + $BackendPid
$msg2 = '  [FAIL] backend    8000  not ready'
if ($BackendPid) { Out-Line $msg1 'Green' } else { Out-Line $msg2 'Red' }

$WebPid = Wait-Port $WebPort 25
$msg3 = "  [OK]   seller-web 3000  PID=" + $WebPid
$msg4 = '  [FAIL] seller-web 3000  not ready'
if ($WebPid) { Out-Line $msg3 'Green' } else { Out-Line $msg4 'Red' }

$AdminPid = Wait-Port $AdminPort 25
$msg5 = "  [OK]   admin-web  5173  PID=" + $AdminPid
$msg6 = '  [FAIL] admin-web  5173  not ready'
if ($AdminPid) { Out-Line $msg5 'Green' } else { Out-Line $msg6 'Red' }

Out-Line ''
Out-Line '========================================' 'Green'
Out-Line '  Endpoints' 'Green'
Out-Line '========================================' 'Green'
Out-Line "  Backend API     : http://127.0.0.1:$BackendPort/"        'Green'
Out-Line "  Health check    : http://127.0.0.1:$BackendPort/api/health/" 'Green'
Out-Line "  Seller console  : http://127.0.0.1:$WebPort/"           'Green'
Out-Line "  Admin console   : http://127.0.0.1:$AdminPort/"         'Green'
Out-Line '  Mini-program: import miniprogram\ in WeChat DevTools' 'Cyan'
Out-Line ''
