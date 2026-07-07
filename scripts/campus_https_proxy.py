"""
campus_https_proxy.py
极简 HTTPS 反向代理：8443 (HTTPS) -> 127.0.0.1:8000 (HTTP Django)
- 读 campus.pfx 提取证书+私钥
- 用 Python ssl 模块包装 socket
- 仅做"路径透传 + Host 头修正 + 跳 HTTPS 时去掉 :8443 端口"
- 单文件，零依赖，dev 期够用
"""
import http.server, ssl, urllib.request, urllib.parse, os, sys, socket, threading

CERT = r'C:\Users\liem\campus.pfx'
CERT_PWD = b'campus'
LISTEN_PORT = 8443
UPSTREAM = 'http://127.0.0.1:8000'


def _load_pem_from_pfx(pfx_path: str, password: bytes):
    """从 PFX 提取 PEM 格式的 cert + key（写到临时文件）"""
    try:
        from cryptography.hazmat.primitives.serialization import pkcs12
    except ImportError:
        print('[FATAL] 缺 cryptography，请运行: pip install cryptography')
        sys.exit(1)

    with open(pfx_path, 'rb') as f:
        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
            f.read(), password
        )

    from cryptography.hazmat.primitives import serialization
    cert_pem = certificate.public_bytes(serialization.Encoding.PEM).decode()
    key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    chain_pem = ''
    for ca in additional_certificates or []:
        chain_pem += ca.public_bytes(serialization.Encoding.PEM).decode()

    cert_file = r'D:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\scripts\_campus_cert.pem'
    key_file = r'D:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\scripts\_campus_key.pem'
    with open(cert_file, 'w') as f:
        f.write(cert_pem + chain_pem)
    with open(key_file, 'w') as f:
        f.write(key_pem)
    return cert_file, key_file


class ProxyHandler(http.server.BaseHTTPRequestHandler):
    """把所有请求转发到上游 HTTP"""

    def _proxy(self, method):
        url = UPSTREAM + self.path
        # 读取 body
        content_length = int(self.headers.get('Content-Length', 0) or 0)
        body = self.rfile.read(content_length) if content_length else None

        # 构造上游请求
        req = urllib.request.Request(url, data=body, method=method)
        # 透传 headers（去掉 Host）
        for k, v in self.headers.items():
            if k.lower() in ('host', 'connection', 'accept-encoding'):
                continue
            req.add_header(k, v)

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                self.send_response(resp.status)
                # 透传响应头
                for k, v in resp.headers.items():
                    if k.lower() in ('transfer-encoding', 'connection', 'server'):
                        continue
                    self.send_header(k, v)
                # 强制 1.1 + 关闭连接（避免 chunked 问题）
                self.send_header('Content-Length', str(len(resp.read())))
                self.end_headers()
                # 重新发（因为 read 过了）
                with urllib.request.urlopen(req, timeout=30) as resp2:
                    self.wfile.write(resp2.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for k, v in (e.headers or {}).items():
                if k.lower() in ('transfer-encoding', 'connection', 'server'):
                    continue
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(e.read() or b'')
        except Exception as e:
            self.send_response(502)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(f'proxy error: {e}'.encode('utf-8'))

    def do_GET(self): self._proxy('GET')
    def do_POST(self): self._proxy('POST')
    def do_PUT(self): self._proxy('PUT')
    def do_DELETE(self): self._proxy('DELETE')
    def do_PATCH(self): self._proxy('PATCH')
    def do_OPTIONS(self): self._proxy('OPTIONS')

    def log_message(self, fmt, *args):
        """控制台日志：时间 + 状态"""
        sys.stdout.write('[%s] %s\n' % (self.log_date_time_string(), fmt % args))
        sys.stdout.flush()


def main():
    print('=' * 60)
    print(f' HTTPS 反向代理  :8443 -> {UPSTREAM}')
    print('=' * 60)
    if not os.path.exists(CERT):
        print(f'[FATAL] 证书不存在: {CERT}')
        print('请先跑: powershell scripts/generate_cert.ps1')
        sys.exit(1)

    cert_file, key_file = _load_pem_from_pfx(CERT, CERT_PWD)

    httpd = http.server.ThreadingHTTPServer(('0.0.0.0', LISTEN_PORT), ProxyHandler)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(certfile=cert_file, keyfile=key_file)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

    print(f'[OK] 启动完成')
    print(f'  - 内部 HTTP 后端: {UPSTREAM}')
    print(f'  - 监听 HTTPS:    https://0.0.0.0:{LISTEN_PORT}/')
    print(f'  - 测试:          https://192.168.31.103:{LISTEN_PORT}/api/products/')
    print(f'')
    print(f'  按 Ctrl+C 停止')
    print('=' * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n[STOP] 收到 Ctrl+C，关闭')
        httpd.shutdown()


if __name__ == '__main__':
    main()
