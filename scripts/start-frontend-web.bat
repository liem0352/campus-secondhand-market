@echo off
REM 启动卖家工作台 Web 前端（frontend-web，校园二手交易平台）
REM 端口：3000
chcp 65001 > nul
setlocal

set PROJECT_ROOT=%~dp0..
set FRONTEND_DIR=%PROJECT_ROOT%\frontend-web

echo ========================================
echo 启动卖家工作台 (端口 3000)
echo 路径: %FRONTEND_DIR%
echo ========================================

cd /d "%FRONTEND_DIR%"

REM 检查 node_modules
if not exist "node_modules" (
    echo [警告] 未安装依赖，正在执行 npm install ...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

REM 启动开发服务器（独立窗口避免被 sandbox 终止）
start "Vue-Web-3000" /B npm run dev

echo.
echo [前端已启动] 访问 http://127.0.0.1:3000/
echo [API 代理]   /api -> http://127.0.0.1:8000
echo.
endlocal
