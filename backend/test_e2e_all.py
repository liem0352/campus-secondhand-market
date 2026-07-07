"""
E2E 关键 API 联调测试脚本
覆盖：认证 / 商品 / 分类 / 订单 / 收藏 / 消息 / 统计 / 管理后台
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

c = Client()
results = []


def log(name, ok, detail=''):
    mark = 'OK' if ok else 'FAIL'
    print(f'[{mark}] {name}  {detail[:120]}')
    results.append((name, ok, detail))


def get_token(username, password):
    r = c.post('/api/auth/login/',
               data=json.dumps({'username': username, 'password': password}),
               content_type='application/json')
    if r.status_code == 200:
        return r.json()['data']['access']
    return None


# 1. 健康检查
r = c.get('/api/health/')
log('health', r.status_code == 200 and r.json().get('code') == 0)

# 2. 登录
token_user = get_token('zhangsan', '123456')
log('login zhangsan', bool(token_user))
token_admin = get_token('admin', 'admin123')
log('login admin', bool(token_admin))

# 3. 当前用户
auth = {'HTTP_AUTHORIZATION': f'Bearer {token_user}'}
r = c.get('/api/users/me/', **auth)
log('users/me', r.status_code == 200, f'status={r.status_code}')

# 4. 分类树
r = c.get('/api/categories/', **auth)
log('categories', r.status_code == 200, f'status={r.status_code} count={len(r.json().get("data", []))}')

# 5. 分类树(嵌套)
r = c.get('/api/categories/tree/', **auth)
log('categories/tree', r.status_code == 200, f'status={r.status_code}')

# 6. 商品列表
r = c.get('/api/products/', **auth)
log('products list', r.status_code == 200, f'status={r.status_code} body_keys={list(r.json().get("data", {}).keys()) if isinstance(r.json().get("data"), dict) else "array"}')

# 7. 我的商品
r = c.get('/api/products/mine/', **auth)
log('products/mine', r.status_code == 200, f'status={r.status_code}')

# 8. 收藏列表
r = c.get('/api/favorites/', **auth)
log('favorites', r.status_code == 200, f'status={r.status_code}')

# 9. 会话列表
r = c.get('/api/conversations/', **auth)
log('conversations', r.status_code == 200, f'status={r.status_code}')

# 10. 订单列表
r = c.get('/api/orders/', **auth)
log('orders', r.status_code == 200, f'status={r.status_code}')

# 11. 我的统计
r = c.get('/api/users/me/stats/', **auth)
log('users/me/stats', r.status_code == 200, f'status={r.status_code}')

# 12. 卖家概览
r = c.get('/api/stats/seller/overview/', **auth)
log('stats/seller/overview', r.status_code == 200, f'status={r.status_code}')

# 13. 卖家趋势
r = c.get('/api/stats/seller/trend/', **auth)
log('stats/seller/trend', r.status_code == 200, f'status={r.status_code}')

# 14. 卖家类目分布
r = c.get('/api/stats/seller/category-distribution/', **auth)
log('stats/seller/cat-dist', r.status_code == 200, f'status={r.status_code}')

# 15. 卖家价格区间
r = c.get('/api/stats/seller/price-range/', **auth)
log('stats/seller/price-range', r.status_code == 200, f'status={r.status_code}')

# 16. Banners
r = c.get('/api/banners/', **auth)
log('banners', r.status_code == 200, f'status={r.status_code}')

# 17. 热门搜索词
r = c.get('/api/hot-keywords/', **auth)
log('hot-keywords', r.status_code == 200, f'status={r.status_code}')

# 18. 站点统计
r = c.get('/api/site-stats/', **auth)
log('site-stats', r.status_code == 200, f'status={r.status_code}')

# 19. 首页 feed
r = c.get('/api/home-feed/', **auth)
log('home-feed', r.status_code == 200, f'status={r.status_code}')

# 20. AI 健康
r = c.get('/api/ai/health/', **auth)
log('ai/health', r.status_code == 200, f'status={r.status_code}')

# ============== 管理员端 ==============
admin_auth = {'HTTP_AUTHORIZATION': f'Bearer {token_admin}'}
r = c.get('/api/admin/dashboard/', **admin_auth)
log('admin/dashboard', r.status_code == 200, f'status={r.status_code}')

r = c.get('/api/admin/dashboard/trend/', **admin_auth)
log('admin/dashboard/trend', r.status_code == 200, f'status={r.status_code}')

r = c.get('/api/admin/dashboard/category-distribution/', **admin_auth)
log('admin/dashboard/cat', r.status_code == 200, f'status={r.status_code}')

r = c.get('/api/admin/users/', **admin_auth)
log('admin/users', r.status_code == 200, f'status={r.status_code}')

r = c.get('/api/admin/products/audit/', **admin_auth)
log('admin/products/audit', r.status_code == 200, f'status={r.status_code}')

r = c.get('/api/admin/products/audit/count/', **admin_auth)
log('admin/products/audit/count', r.status_code == 200, f'status={r.status_code}')

r = c.get('/api/admin/categories/', **admin_auth)
log('admin/categories', r.status_code == 200, f'status={r.status_code}')

r = c.get('/api/admin/reports/', **admin_auth)
log('admin/reports', r.status_code == 200, f'status={r.status_code}')

r = c.get('/api/admin/reports/count/', **admin_auth)
log('admin/reports/count', r.status_code == 200, f'status={r.status_code}')

r = c.get('/api/admin/audit-logs/', **admin_auth)
log('admin/audit-logs', r.status_code == 200, f'status={r.status_code}')

r = c.get('/api/admin/ai/health/', **admin_auth)
log('admin/ai/health', r.status_code == 200, f'status={r.status_code}')

# 22. 未鉴权访问受保护接口（应当 401）
r = c.get('/api/users/me/')
log('users/me unauth -> 401', r.status_code == 401, f'status={r.status_code}')

# 23. 普通用户访问管理接口（应当 403）
r = c.get('/api/admin/dashboard/', **auth)
log('admin denied for user -> 403', r.status_code == 403, f'status={r.status_code}')

# 汇总
print()
total = len(results)
passed = sum(1 for _, ok, _ in results if ok)
print(f'=== 汇总: {passed}/{total} 通过 ===')
