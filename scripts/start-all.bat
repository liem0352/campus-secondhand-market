@echo off
REM 一键启动校园二手交易平台全部服务（后端 + 卖家工作台 + 平台管理后台）
chcp 65001 > nul

echo ========================================
echo 一键启动校园二手交易平台全部服务
echo ========================================
echo.
echo [1/3] 启动后端 Django (8000) ...
call "%~dp0start-backend.bat"

echo.
echo [2/3] 启动卖家工作台 (3000) ...
call "%~dp0start-frontend-web.bat"

echo.
echo [3/3] 启动平台管理后台 (5173) ...
call "%~dp0start-frontend-admin.bat"

echo.
echo ========================================
echo 全部服务已启动！
echo   - 后端:           http://127.0.0.1:8000/
echo   - 卖家工作台:     http://127.0.0.1:3000/
echo   - 平台管理后台:   http://127.0.0.1:5173/
echo ========================================
echo.
echo 微信小程序请在微信开发者工具中导入 miniprogram\ 目录
pause
