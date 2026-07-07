@echo off
REM 启动 Django 后端服务（校园二手交易平台）
REM 端口：8000
chcp 65001 > nul
set PYTHONIOENCODING=utf-8
setlocal

set PROJECT_ROOT=%~dp0..
set BACKEND_DIR=%PROJECT_ROOT%\backend
set PYTHON_EXE=C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe

echo ========================================
echo 启动校园二手交易平台 Django 后端 (端口 8000)
echo 路径: %BACKEND_DIR%
echo ========================================

cd /d "%BACKEND_DIR%"

REM 检查虚拟环境（可选）
if not exist "venv\Scripts\python.exe" (
    echo [提示] 未检测到 venv 虚拟环境，使用系统 Python: %PYTHON_EXE%
    set PYTHON_EXE=%PYTHON_EXE%
) else (
    echo [提示] 使用虚拟环境: venv
    set PYTHON_EXE=venv\Scripts\python.exe
)

REM 启动 Django 开发服务器（--noreload 避免被 sandbox 终止子进程）
start "Django-Backend-8000" /B "%PYTHON_EXE%" manage.py runserver 0.0.0.0:8000 --noreload

echo.
echo [后端已启动] 访问 http://127.0.0.1:8000/
echo [健康检查]    http://127.0.0.1:8000/api/health/
echo.
endlocal
