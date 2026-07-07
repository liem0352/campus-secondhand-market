@echo off
REM 安装校园二手交易平台所有依赖（Python + 两个前端）
chcp 65001 > nul

set PROJECT_ROOT=%~dp0..
set PYTHON_EXE=C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe

echo ========================================
echo 安装校园二手交易平台依赖
echo ========================================

echo.
echo [1/3] 安装后端 Python 依赖 ...
cd /d "%PROJECT_ROOT%\backend"
"%PYTHON_EXE%" -m pip install -r requirements.txt
if errorlevel 1 goto :error
"%PYTHON_EXE%" -m pip install -r requirements-voice.txt

echo.
echo [2/3] 安装卖家工作台前端依赖 (npm install) ...
cd /d "%PROJECT_ROOT%\frontend-web"
call npm install
if errorlevel 1 goto :error

echo.
echo [3/3] 安装平台管理后台前端依赖 (npm install) ...
cd /d "%PROJECT_ROOT%\frontend-admin"
call npm install
if errorlevel 1 goto :error

echo.
echo ========================================
echo 所有依赖安装完成！
echo ========================================
echo 下一步：
echo   1. 初始化数据库: 参考 docs\部署说明.md
echo   2. 启动服务:     scripts\start-all.bat
echo ========================================
pause
exit /b 0

:error
echo.
echo [错误] 依赖安装失败，请检查网络或源配置
pause
exit /b 1
