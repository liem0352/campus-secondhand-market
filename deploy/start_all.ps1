﻿# 一键启动校园二手交易平台全部服务
# 顺序：后端 -> 卖家工作台 -> 平台管理后台
# 用法：在 PowerShell 中执行   .\deploy\start_all.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Campus Market - Start All Services  ' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

# ---------- 1. Backend ----------
Write-Host '[1/3] Starting Django Backend (8000) ...' -ForegroundColor Yellow
& (Join-Path $ScriptDir 'start_backend.ps1')
if ($LASTEXITCODE -ne 0) {
    Write-Host '[ERROR] Backend failed to start' -ForegroundColor Red
    exit 1
}
Write-Host ''

Start-Sleep -Seconds 2

# ---------- 2. Web Frontend ----------
Write-Host '[2/3] Starting Web Frontend (3000) ...' -ForegroundColor Yellow
& (Join-Path $ScriptDir 'start_frontend_web.ps1')
if ($LASTEXITCODE -ne 0) {
    Write-Host '[ERROR] Web Frontend failed to start' -ForegroundColor Red
    exit 1
}
Write-Host ''

Start-Sleep -Seconds 2

# ---------- 3. Admin Frontend ----------
Write-Host '[3/3] Starting Admin Frontend (5173) ...' -ForegroundColor Yellow
& (Join-Path $ScriptDir 'start_frontend_admin.ps1')
if ($LASTEXITCODE -ne 0) {
    Write-Host '[ERROR] Admin Frontend failed to start' -ForegroundColor Red
    exit 1
}
Write-Host ''

# ---------- Summary ----------
Write-Host '========================================' -ForegroundColor Green
Write-Host '  All Services Started!  ' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host '  Backend API    : http://127.0.0.1:8000/' -ForegroundColor Green
Write-Host '  Health Check   : http://127.0.0.1:8000/api/health/' -ForegroundColor Green
Write-Host '  Seller Portal  : http://127.0.0.1:3000/' -ForegroundColor Green
Write-Host '  Admin Panel    : http://127.0.0.1:5173/' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Miniprogram: import miniprogram/ in WeChat DevTools' -ForegroundColor Cyan
Write-Host 'Stop all: .\deploy\stop_all.ps1' -ForegroundColor Cyan
Write-Host ''