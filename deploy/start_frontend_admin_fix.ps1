# 修复版：启动平台管理后台
# 直接调用 vite.js，绕开 npm.cmd 在 hidden 窗口下被回收的问题
# 并在前后留出足够等待时间确保 vite 真正完成绑定

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectRoot = 'd:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训'
$FrontendDir = Join-Path $ProjectRoot 'frontend-admin'
$LogDir      = Join-Path $ProjectRoot 'logs'
$ViteJs      = Join-Path $FrontendDir 'node_modules\vite\bin\vite.js'
$LogFile     = Join-Path $LogDir 'frontend-admin.log'
$ErrFile     = Join-Path $LogDir 'frontend-admin.err.log'
$Port        = 5173

# 清理日志
if (Test-Path $LogFile) { Remove-Item $LogFile -Force }
if (Test-Path $ErrFile) { Remove-Item $ErrFile -Force }

# 检查端口
$PortInUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($PortInUse) {
    Write-Host "端口 $Port 已被占用 (PID=$($PortInUse.OwningProcess))，先终止" -ForegroundColor Yellow
    Stop-Process -Id $PortInUse.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# 检查依赖
if (-not (Test-Path $ViteJs)) {
    Write-Host "未检测到 vite，正在安装依赖 ..." -ForegroundColor Yellow
    Set-Location $FrontendDir
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Host "npm install 失败" -ForegroundColor Red; exit 1 }
}

# 启动 vite
Write-Host "启动 vite (frontend-admin) ..." -ForegroundColor Green
$Proc = Start-Process -FilePath "node.exe" `
                       -ArgumentList "`"$ViteJs`"" `
                       -WorkingDirectory $FrontendDir `
                       -RedirectStandardOutput $LogFile `
                       -RedirectStandardError $ErrFile `
                       -WindowStyle Normal `
                       -PassThru
Write-Host "frontend-admin PID = $($Proc.Id)"

# 等待端口就绪
$MaxWait = 30
for ($i = 0; $i -lt $MaxWait; $i++) {
    Start-Sleep -Seconds 1
    $Listen = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($Listen) {
        Write-Host "端口 $Port 已就绪 (PID=$($Listen.OwningProcess))" -ForegroundColor Green
        Write-Host "访问地址: http://127.0.0.1:$Port/" -ForegroundColor Green
        exit 0
    }
    if ($Proc.HasExited) {
        Write-Host "vite 进程已退出，退出码 = $($Proc.ExitCode)" -ForegroundColor Red
        Write-Host "--- 日志 ---" -ForegroundColor Yellow
        if (Test-Path $LogFile) { Get-Content $LogFile }
        if (Test-Path $ErrFile) { Get-Content $ErrFile }
        exit 1
    }
}

Write-Host "等待端口超时" -ForegroundColor Red
Write-Host "--- 日志 ---" -ForegroundColor Yellow
if (Test-Path $LogFile) { Get-Content $LogFile }
exit 1
