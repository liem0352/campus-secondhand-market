"""
启动 Django (HTTP 8000) + HTTPS Proxy (8443)
用于 dev 期给小程序提供 HTTPS 服务
"""
import subprocess, sys, time, os, signal, threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT / 'backend')

PYTHON = r'C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe'

print('=' * 60)
print(' 启动 Django + HTTPS Proxy（dev 集成环境）')
print('=' * 60)

# 1. 启动 Django
print('\n[1/2] 启动 Django on http://0.0.0.0:8000 ...')
django_log = open(ROOT / 'scripts' / '_django.log', 'w', encoding='utf-8')
django = subprocess.Popen(
    [PYTHON, 'manage.py', 'runserver', '0.0.0.0:8000'],
    stdout=django_log, stderr=subprocess.STDOUT,
    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
)

# 2. 等 Django 起来
for i in range(15):
    time.sleep(1)
    import socket
    try:
        s = socket.create_connection(('127.0.0.1', 8000), timeout=1)
        s.close()
        print(f'   [OK] Django 8000 已就绪 ({i+1}s)')
        break
    except OSError:
        pass
else:
    print('   [WARN] Django 8000 启动慢，继续启动 proxy')

# 3. 启动 HTTPS Proxy
print('\n[2/2] 启动 HTTPS Proxy on https://0.0.0.0:8443 ...')
proxy_log = open(ROOT / 'scripts' / '_proxy.log', 'w', encoding='utf-8')
proxy = subprocess.Popen(
    [PYTHON, str(ROOT / 'scripts' / 'campus_https_proxy.py')],
    stdout=proxy_log, stderr=subprocess.STDOUT,
    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
)

# 4. 等 Proxy 起来
for i in range(8):
    time.sleep(1)
    import socket
    try:
        s = socket.create_connection(('127.0.0.1', 8443), timeout=1)
        s.close()
        print(f'   [OK] Proxy 8443 已就绪 ({i+1}s)')
        break
    except OSError:
        pass
else:
    print('   [WARN] Proxy 8443 启动慢')

print('\n' + '=' * 60)
print(' 全部就绪')
print('=' * 60)
print(f'  Django (HTTP):     http://127.0.0.1:8000')
print(f'  HTTPS Proxy:       https://127.0.0.1:8443')
print(f'  局域网 HTTPS:      https://192.168.31.103:8443')
print(f'  测试: curl -k https://192.168.31.103:8443/api/health/')
print()
print(f'  进程: Django PID={django.pid}  Proxy PID={proxy.pid}')
print(f'  日志: scripts\\_django.log  scripts\\_proxy.log')
print()
print('  按 Ctrl+C 关闭两个服务')
print('=' * 60)

# 5. 持续监控
try:
    while True:
        time.sleep(2)
        if django.poll() is not None:
            print('[STOP] Django 已退出')
            break
        if proxy.poll() is not None:
            print('[STOP] Proxy 已退出')
            break
except KeyboardInterrupt:
    print('\n[STOP] Ctrl+C, 关闭...')

# 6. 收尾
for name, p in [('Django', django), ('Proxy', proxy)]:
    try:
        p.terminate()
        p.wait(timeout=3)
    except Exception:
        p.kill()
print('[DONE]')
