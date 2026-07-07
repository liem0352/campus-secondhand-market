@echo off
chcp 65001 > nul
rem 启动 HTTPS 反向代理（dev 期用）
cd /d "D:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训"
"C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe" scripts\campus_https_proxy.py
pause
