# 一键停止校园二手交易平台所有服务
# 关闭占用 8000 / 3000 / 5173 端口的进程，并兜底清理 Python / Node 进程
# 用法：在 PowerShell 中执行   .\deploy\stop_all.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = 'SilentlyContinue'

$Ports = @(8000, 3000, 5173)

Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' 停止校园二手交易平台所有服务 ' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

# ---------- 1. 按端口关闭 ----------
foreach ($P in $Ports) {
    Write-Host "[步骤] 关闭端口 $P 上的进程 ..." -ForegroundColor Yellow
    $Conns = Get-NetTCPConnection -LocalPort $P -State Listen -ErrorAction SilentlyContinue
    foreach ($C in $Conns) {
        $Pid = $C.OwningProcess
        if ($Pid) {
            Write-Host "  - 终止 PID=$Pid" -ForegroundColor Gray
            Stop-Process -Id $Pid -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------- 2. 兜底：清理 Python（waitress） ----------
Write-Host '[步骤] 兜底清理 waitress / Django 进程 ...' -ForegroundColor Yellow
Get-Process -Name 'python' -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like '*waitress*' -or
    $_.CommandLine -like '*waitress*' -or
    $_.CommandLine -like '*config.wsgi*'
} | ForEach-Object {
    Write-Host "  - 终止 Python PID=$($_.Id)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# ---------- 3. 兜底：清理 Node（Vite） ----------
Write-Host '[步骤] 兜底清理 Vite / Node 进程 ...' -ForegroundColor Yellow
Get-Process -Name 'node' -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like '*vite*' -or
    $_.MainWindowTitle -like '*Vue-*'
} | ForEach-Object {
    Write-Host "  - 终止 Node PID=$($_.Id)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ''
Write-Host '========================================' -ForegroundColor Green
Write-Host ' [完成] 所有服务已停止' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host ''
Write-Host '重新启动： .\deploy\start_all.ps1' -ForegroundColor Cyan
Write-Host ''
