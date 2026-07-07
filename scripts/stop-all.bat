@echo off
REM 停止校园二手交易平台所有相关服务（8000/3000/5173）
chcp 65001 > nul

echo ========================================
echo 停止校园二手交易平台所有服务
echo ========================================

for %%P in (8000 3000 5173) do (
    echo [停止] 端口 %%P ...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P " ^| findstr LISTENING') do (
        taskkill /F /PID %%a > nul 2>&1
    )
)

REM 兜底：按进程名清理
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Django-Backend-8000*" > nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Vue-Web-3000*" > nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Vue-Admin-5173*" > nul 2>&1

echo.
echo [完成] 所有服务已停止
pause
