# 一键初始化数据库
# 流程：建库 -> 安装依赖 -> 生成迁移 -> 执行迁移 -> 初始化种子数据
# 用法：在 PowerShell 中执行   .\deploy\setup_database.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = 'Stop'

# ---------- 路径配置 ----------
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir '..')
$BackendDir  = Join-Path $ProjectRoot 'backend'
$SqlFile     = Join-Path $BackendDir 'scripts\create_mysql_db.sql'
$InitScript  = Join-Path $BackendDir 'scripts\init_data_market.py'

$PythonExe = 'C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe'
$MySqlExe  = 'C:\Program Files\MySQL\MySQL Server 9.4\bin\mysql.exe'
$DbUser    = 'root'
$DbPass    = 'tyb1124'
$DbName    = 'campus_market'

Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' 一键初始化数据库 ' -ForegroundColor Cyan
Write-Host " 库名 : $DbName (utf8mb4)" -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

# ---------- 0. 前置：检查 .env ----------
$EnvFile = Join-Path $BackendDir '.env'
if (-not (Test-Path $EnvFile)) {
    Write-Host '[步骤] 未发现 backend\.env，从 .env.example 复制 ...' -ForegroundColor Yellow
    Copy-Item (Join-Path $BackendDir '.env.example') $EnvFile
}

# ---------- 1. 建库 ----------
Write-Host '[1/4] 创建数据库 campus_market ...' -ForegroundColor Yellow
if (-not (Test-Path $MySqlExe)) {
    Write-Host "[错误] 未找到 mysql 客户端：$MySqlExe" -ForegroundColor Red
    exit 1
}
& $MySqlExe -u $DbUser -p$DbPass -e "SELECT VERSION();"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] MySQL 连接失败，请检查账号密码 (当前: $DbUser / $DbPass)" -ForegroundColor Red
    exit 1
}

Get-Content $SqlFile | & $MySqlExe -u $DbUser -p$DbPass
if ($LASTEXITCODE -ne 0) {
    Write-Host '[错误] 建库 SQL 执行失败' -ForegroundColor Red
    exit 1
}
Write-Host "[完成] 库 $DbName 已就绪" -ForegroundColor Green
Write-Host ''

# ---------- 2. 安装 Python 依赖 ----------
Write-Host '[2/4] 安装 Python 依赖 (pip install -r requirements.txt) ...' -ForegroundColor Yellow
Set-Location $BackendDir
& $PythonExe -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host '[错误] Python 依赖安装失败' -ForegroundColor Red
    exit 1
}
& $PythonExe -m pip install -r requirements-voice.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host '[警告] requirements-voice.txt 安装失败（非致命）' -ForegroundColor Yellow
}
Write-Host '[完成] Python 依赖已就绪' -ForegroundColor Green
Write-Host ''

# ---------- 3. 迁移 ----------
Write-Host '[3/4] 生成并执行数据库迁移 (makemigrations + migrate) ...' -ForegroundColor Yellow
& $PythonExe manage.py makemigrations market
if ($LASTEXITCODE -ne 0) {
    Write-Host '[警告] makemigrations 返回非 0，可能无新变更，继续执行 migrate' -ForegroundColor Yellow
}
& $PythonExe manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host '[错误] migrate 失败' -ForegroundColor Red
    exit 1
}
Write-Host '[完成] 数据库迁移已应用' -ForegroundColor Green
Write-Host ''

# ---------- 4. 种子数据 ----------
Write-Host '[4/4] 初始化种子数据 (init_data_market.py) ...' -ForegroundColor Yellow
& $PythonExe scripts/init_data_market.py
if ($LASTEXITCODE -ne 0) {
    Write-Host '[错误] 种子数据初始化失败' -ForegroundColor Red
    exit 1
}
Write-Host '[完成] 种子数据已写入' -ForegroundColor Green
Write-Host ''

# ---------- 汇总 ----------
Write-Host '========================================' -ForegroundColor Green
Write-Host ' 数据库初始化完成！' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host "  数据库      : $DbName" -ForegroundColor Green
Write-Host '  默认账号    :' -ForegroundColor Green
Write-Host '    admin    / admin123   (平台管理后台)' -ForegroundColor Green
Write-Host '    zhangsan / 123456     (卖家)' -ForegroundColor Green
Write-Host '    lisi     / 123456     (卖家)' -ForegroundColor Green
Write-Host '    wangwu   / 123456     (买家)' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host ''
Write-Host '下一步： .\deploy\start_all.ps1' -ForegroundColor Cyan
Write-Host ''
