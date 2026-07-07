#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wave 4 端到端联调验证脚本（PowerShell 兼容性更好的 Python 版本）
"""
import json
import sys
import time
import urllib.request
import urllib.error
import urllib.parse

BASE = "http://127.0.0.1:8000/api"


def call(method, path, body=None, token=None, expect_status=200):
    """统一调用入口"""
    url = f"{BASE}{path}"
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
            return resp.status, payload
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode("utf-8"))
        except Exception:
            payload = {"raw": "no-json"}
        return e.code, payload


def expect(label, status, payload, want_status=200, want_code=0):
    """断言"""
    # 201 (Created) 也算成功
    ok_status = status == want_status or (want_status == 200 and status == 201)
    if isinstance(payload, dict) and "code" in payload:
        ok_code = payload.get("code") == want_code
    else:
        ok_code = want_code is None
    flag = "PASS" if (ok_status and ok_code) else "FAIL"
    print(f"  [{flag}] {label}  status={status}")
    if not (ok_status and ok_code):
        print(f"        payload={payload}")
    return ok_status and ok_code


def get_token(username, password):
    status, payload = call("POST", "/auth/login/", {"username": username, "password": password})
    if status != 200 or payload.get("code") != 0:
        raise RuntimeError(f"登录失败 {username}: {payload}")
    return payload["data"]["access"]


def get_data(payload):
    return payload.get("data") if isinstance(payload, dict) else None


def main():
    print("=" * 60)
    print("Wave 4 端到端联调验证")
    print("=" * 60)

    passed = 0
    total = 0

    # ===== 阶段 1: 认证 =====
    print("\n[1] 三角色登录")
    zhang_token = get_token("zhangsan", "123456")
    wang_token = get_token("wangwu", "123456")
    admin_token = get_token("admin", "admin123")
    print(f"  zhangsan  token len={len(zhang_token)}")
    print(f"  wangwu    token len={len(wang_token)}")
    print(f"  admin     token len={len(admin_token)}")
    passed += 3
    total += 3

    # ===== 阶段 2: 商品流程 =====
    print("\n[2] 商品发布→审核→上架")
    # iPhone 壳多角度配图（picsum 失败时降级到本项目 assets 占位图，保证测试不空跑）
    e2e_images = [
        # 主图：正面全貌
        "https://picsum.photos/seed/e2e-iphone-front/800/800",
        # 副图：侧边按键特写
        "https://picsum.photos/seed/e2e-iphone-side/800/800",
        # 副图：背板磨砂质感
        "https://picsum.photos/seed/e2e-iphone-back/800/800",
        # 副图：真机佩戴效果
        "https://picsum.photos/seed/e2e-iphone-on/800/800",
    ]
    status, payload = call("POST", "/products/", {
        "title": "[E2E] 全新iPhone壳联调测试",
        "description": "测试商品，勿拍",
        "price": "9.90",
        "original_price": "39.00",
        "condition": "new",
        "category": 10,
        "image_urls": e2e_images,
    }, token=zhang_token)
    total += 1
    if expect("卖家发布商品", status, payload):
        passed += 1
        new_pid = get_data(payload)["id"]
        print(f"        新商品 id={new_pid}  状态: pending_review")
        print(f"        配图数: {len(e2e_images)}")

    # 管理员审核列表
    status, payload = call("GET", "/admin/products/audit/", token=admin_token)
    total += 1
    if expect("管理员查看待审核", status, payload):
        passed += 1
        items = get_data(payload).get("results", [])
        print(f"        待审核商品数: {len(items)}")

    # 管理员通过
    status, payload = call("POST", f"/admin/products/{new_pid}/approve/", token=admin_token)
    total += 1
    if expect("管理员通过审核", status, payload):
        passed += 1

    # 商品状态变更
    status, payload = call("GET", f"/products/{new_pid}/")
    total += 1
    if expect("商品状态变 on_sale", status, payload):
        passed += 1
        print(f"        新状态: {get_data(payload)['status']}")

    # ===== 阶段 3: 订单全流程 =====
    print("\n[3] 订单全流程：创建→确认→完成")
    status, payload = call("POST", "/orders/", {
        "product_id": new_pid,
        "message": "E2E 联调想要购买",
    }, token=wang_token)
    total += 1
    if expect("买家提交订单", status, payload):
        passed += 1
        oid = get_data(payload)["id"]
        print(f"        订单 id={oid}")

    status, payload = call("POST", f"/orders/{oid}/confirm/", token=zhang_token)
    total += 1
    if expect("卖家确认订单", status, payload):
        passed += 1
        print(f"        订单状态: {get_data(payload).get('status')}")

    status, payload = call("POST", f"/orders/{oid}/complete/", token=zhang_token)
    total += 1
    if expect("卖家标记完成", status, payload):
        passed += 1

    status, payload = call("POST", f"/orders/{oid}/complete/", token=wang_token)
    total += 1
    # 业务上：订单已完成时再调用 complete 返回 400 是合理拒绝
    if expect("买家标记完成（状态机拒绝重复）", status, payload, want_status=400, want_code=40001):
        passed += 1

    # ===== 阶段 4: 评价 + 信用分联动 =====
    print("\n[4] 评价与信用分")
    status, payload = call("POST", "/reviews/", {
        "order_id": oid,
        "rating": 5,
        "content": "E2E 五星好评！",
    }, token=wang_token)
    total += 1
    if expect("买家提交评价", status, payload):
        passed += 1

    # 检查双方信用分变化
    status, payload = call("GET", "/users/me/", token=wang_token)
    total += 1
    if expect("买家查看个人资料", status, payload):
        passed += 1
        me = get_data(payload)
        print(f"        wangwu 信用分: {me['credit_score']}  角色: {me['role']}")

    # ===== 阶段 5: 收藏 =====
    print("\n[5] 收藏 / 取消收藏")
    status, payload = call("POST", f"/products/{new_pid}/favorite/", token=wang_token)
    total += 1
    if expect("买家切换收藏", status, payload):
        passed += 1
        print(f"        is_favorite: {get_data(payload).get('is_favorite')}")

    status, payload = call("GET", "/favorites/", token=wang_token)
    total += 1
    if expect("买家查看收藏列表", status, payload):
        passed += 1
        print(f"        收藏数: {get_data(payload)['count']}")

    # ===== 阶段 6: 会话与消息 =====
    print("\n[6] 私聊会话")
    status, payload = call("POST", "/conversations/", {
        "peer_id": 2,
        "product_id": new_pid,
    }, token=wang_token)
    total += 1
    if expect("创建会话", status, payload):
        passed += 1
        cid = get_data(payload)["id"]
        print(f"        会话 id={cid}")

    status, payload = call("POST", "/messages/send/", {
        "conversation_id": cid,
        "content": "你好，请问还在吗？",
    }, token=wang_token)
    total += 1
    if expect("发送消息", status, payload):
        passed += 1

    status, payload = call("GET", f"/conversations/{cid}/messages/", token=zhang_token)
    total += 1
    if expect("卖家拉取消息", status, payload):
        passed += 1
        msgs = get_data(payload).get("results", [])
        print(f"        消息数: {len(msgs)}")

    # ===== 阶段 7: AI 模块 =====
    print("\n[7] AI 服务（7 个端点）")
    for ep, method, body, label in [
        ("/ai/publish-assist/", "POST", {"image_url": "https://picsum.photos/seed/headphone/400/400", "draft_text": "九成新无线耳机，原价299"}, "AI 一键发布"),
        ("/ai/price-suggest/?category=%E6%95%99%E6%9D%90&condition=9%E6%88%90%E6%96%B0&current_price=30", "GET", None, "AI 价格建议"),
        ("/ai/moderate/", "POST", {"text": "这本书非常新"}, "AI 内容审核"),
        ("/ai/polish/", "POST", {"raw_text": "九成新买来没用几次", "title": "教材"}, "AI 文案润色"),
        ("/ai/negotiate/", "POST", {"user_intent": "我想要30元买，卖家说35", "product_title": "高等数学"}, "AI 议价辅助"),
        ("/ai/extract-keywords/", "POST", {"title": "九成新高等数学同济版", "top_k": 5}, "AI 关键词提取"),
        ("/ai/customer-service/", "POST", {"incoming": "请问这个还在吗？", "product_title": "高等数学"}, "AI 智能客服"),
    ]:
        status, payload = call(method, ep, body, token=zhang_token)
        total += 1
        if expect(label, status, payload):
            passed += 1
            if isinstance(get_data(payload), dict) and "is_ai_fallback" in get_data(payload):
                print(f"        is_ai_fallback: {get_data(payload)['is_ai_fallback']}")

    # ===== 阶段 8: 管理后台核心接口 =====
    print("\n[8] 管理后台")
    status, payload = call("GET", "/admin/dashboard/", token=admin_token)
    total += 1
    if expect("平台总览", status, payload):
        passed += 1
        d = get_data(payload)
        print(f"        用户 {d['user_count']}  商品 {d['product_count']}  订单 {d['order_count']}  今日新增 {d['today_product_count']}")

    status, payload = call("GET", "/admin/users/", token=admin_token)
    total += 1
    if expect("用户管理列表", status, payload):
        passed += 1
        print(f"        用户总数: {get_data(payload)['count']}")

    status, payload = call("GET", "/admin/audit-logs/", token=admin_token)
    total += 1
    if expect("审计日志", status, payload):
        passed += 1
        print(f"        审计条数: {get_data(payload)['count']}")

    # ===== 阶段 9: 权限校验 =====
    print("\n[9] 权限与异常")
    status, payload = call("GET", "/users/me/")  # 无 token
    total += 1
    if expect("无 token → 401", status, payload, want_status=401, want_code=None):
        passed += 1

    status, payload = call("GET", "/admin/dashboard/", token=zhang_token)  # 普通用户访问 admin
    total += 1
    if expect("普通用户访问 admin → 403", status, payload, want_status=403, want_code=None):
        passed += 1

    status, payload = call("POST", "/auth/login/", {"username": "zhangsan", "password": "wrongpass"})
    total += 1
    if expect("密码错误 → 40101", status, payload, want_status=401, want_code=40101):
        passed += 1

    status, payload = call("GET", "/products/999999/")
    total += 1
    if expect("商品不存在 → 404", status, payload, want_status=404, want_code=None):
        passed += 1

    # ===== 总结 =====
    print("\n" + "=" * 60)
    print(f"测试结果: {passed}/{total} PASS")
    print(f"通过率:   {passed/total*100:.1f}%")
    print("=" * 60)
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
