"""端到端 API 测试脚本 — 校园二手交易平台。

按顺序测试以下 6 个端点：
1. GET  /api/health/                 健康检查
2. POST /api/auth/login/             用户登录
3. GET  /api/users/me/               当前用户资料
4. GET  /api/categories/             分类列表
5. GET  /api/products/               商品列表
6. POST /api/ai/price-suggest/       AI 价格建议

每个端点打印：
- HTTP 状态码
- 响应体（截取前 400 字符）
- 业务码 code
"""
import json
import sys
import time
from pathlib import Path

import urllib.request
import urllib.error
import urllib.parse

BASE = "http://127.0.0.1:8000"
HEADERS_JSON = {"Content-Type": "application/json"}


def http(method: str, path: str, body: dict = None, token: str = None, timeout: int = 15):
    """执行 HTTP 请求并以字典形式返回响应。"""
    url = BASE + path
    data = None
    headers = dict(HEADERS_JSON)
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            text = resp.read().decode("utf-8", errors="replace")
            return {
                "status": resp.status,
                "body": text,
                "ok": True,
            }
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        return {
            "status": exc.code,
            "body": text,
            "ok": False,
        }
    except Exception as exc:
        return {
            "status": -1,
            "body": str(exc),
            "ok": False,
        }


def parse_business_code(body: str):
    """从响应体提取业务码 code。"""
    try:
        return json.loads(body).get("code")
    except Exception:
        return None


def case(name: str, method: str, path: str, body=None, token=None):
    """执行一个测试用例并打印结果。"""
    print(f"\n===== {name} =====")
    print(f"  {method} {path}")
    if body is not None:
        print(f"  body: {json.dumps(body, ensure_ascii=False)[:200]}")
    result = http(method, path, body, token)
    snippet = result["body"][:400] if result["body"] else ""
    print(f"  status: {result['status']}")
    print(f"  biz_code: {parse_business_code(result['body'])}")
    print(f"  body: {snippet}")
    return result


def main():
    """主测试流程。"""
    print(f"开始端到端测试 @ {time.strftime('%H:%M:%S')}")
    print(f"Base URL: {BASE}")
    print("=" * 60)

    results = []

    # 1) 健康检查
    r = case("测试 1: 健康检查", "GET", "/api/health/")
    results.append(("health", r["status"], parse_business_code(r["body"])))

    # 2) 用户登录
    r = case(
        "测试 2: 用户登录",
        "POST",
        "/api/auth/login/",
        body={"username": "zhangsan", "password": "123456"},
    )
    results.append(("login", r["status"], parse_business_code(r["body"])))
    token = None
    if r["ok"]:
        try:
            token = json.loads(r["body"])["data"]["access"]
            print(f"  [获取 token 成功，长度={len(token)}]")
        except Exception as exc:
            print(f"  [解析 token 失败: {exc}]")
            token = None

    if not token:
        # 尝试 admin 账号
        r2 = case(
            "测试 2b: 管理员登录",
            "POST",
            "/api/auth/login/",
            body={"username": "admin", "password": "admin123"},
        )
        if r2["ok"]:
            token = json.loads(r2["body"])["data"]["access"]
            print(f"  [使用 admin token]")

    # 3) 当前用户资料
    if token:
        r = case("测试 3: 当前用户资料", "GET", "/api/users/me/", token=token)
        results.append(("me", r["status"], parse_business_code(r["body"])))

        # 4) 分类列表
        r = case("测试 4: 分类列表", "GET", "/api/categories/", token=token)
        results.append(("categories", r["status"], parse_business_code(r["body"])))

        # 5) 商品列表
        r = case("测试 5: 商品列表", "GET", "/api/products/", token=token)
        results.append(("products", r["status"], parse_business_code(r["body"])))

        # 6) AI 价格建议（GET 接口，通过 query string 传参）
        r = case(
            "测试 6: AI 价格建议 (GET)",
            "GET",
            "/api/ai/price-suggest/?category=" + urllib.parse.quote("教材书籍") + "&condition=9%E6%88%90%E6%96%B0&current_price=30",
            token=token,
        )
        results.append(("ai_price", r["status"], parse_business_code(r["body"])))

        # 6b) AI 内容审核（POST 接口，验证 POST 也正常）
        r = case(
            "测试 6b: AI 内容审核 (POST)",
            "POST",
            "/api/ai/moderate/",
            body={"text": "这本书非常新，几乎没有使用痕迹。"},
            token=token,
        )
        results.append(("ai_moderate", r["status"], parse_business_code(r["body"])))

        # 6c) 我的商品（验证资源拥有者权限）
        r = case(
            "测试 6c: 我的商品 (GET)",
            "GET",
            "/api/products/mine/",
            token=token,
        )
        results.append(("products_mine", r["status"], parse_business_code(r["body"])))

        # 7) 异常路径：未携带 token
        r = case(
            "测试 7: 鉴权失败（无 token）",
            "GET",
            "/api/users/me/",
        )
        results.append(("unauth", r["status"], parse_business_code(r["body"])))

        # 8) 异常路径：登录密码错误
        r = case(
            "测试 8: 登录密码错误",
            "POST",
            "/api/auth/login/",
            body={"username": "zhangsan", "password": "wrongpass"},
        )
        results.append(("bad_pwd", r["status"], parse_business_code(r["body"])))

        # 9) 异常路径：不存在的商品
        r = case(
            "测试 9: 商品不存在 (404)",
            "GET",
            "/api/products/999999/",
            token=token,
        )
        results.append(("not_found", r["status"], parse_business_code(r["body"])))
    else:
        print("\n[!!! 跳过测试 3-6：未获取到有效 token]")

    # 汇总
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)

    # 正向用例：HTTP 200 + biz_code 0 才算 PASS
    positive = {"health", "login", "me", "categories", "products",
                "ai_price", "ai_moderate", "products_mine"}
    # 负向用例：HTTP 非 200 视为"按预期失败"，即 PASS
    negative = {"unauth", "bad_pwd", "not_found"}

    print(f"{'端点':<15} {'HTTP':<8} {'业务码':<10} {'是否通过'}")
    print("-" * 60)
    pass_count = 0
    for name, status, biz in results:
        if name in positive:
            ok = "PASS" if (status == 200 and biz == 0) else "FAIL"
        elif name in negative:
            ok = "PASS" if status != 200 else "FAIL（应失败）"
        else:
            ok = "?"
        if ok == "PASS":
            pass_count += 1
        print(f"{name:<15} {status:<8} {str(biz):<10} {ok}")
    print(f"\n通过 {pass_count}/{len(results)}")
    return 0 if pass_count == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
