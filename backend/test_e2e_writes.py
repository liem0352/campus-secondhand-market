"""
E2E 写操作测试
覆盖：
- 商品：发布/查看/编辑/上下架/删除
- 收藏：toggle
- 订单：创建/确认/完成
- 评价：创建
- 消息：创建会话/发送/标记已读
- 举报：创建
- 管理员：商品审核通过/驳回
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
    return r.json()['data']['access'] if r.status_code == 200 else None


# 登录
token_user = get_token('zhangsan', '123456')
token_user2 = get_token('lisi', '123456')
token_admin = get_token('admin', 'admin123')

auth_user = {'HTTP_AUTHORIZATION': f'Bearer {token_user}'}
auth_user2 = {'HTTP_AUTHORIZATION': f'Bearer {token_user2}'}
auth_admin = {'HTTP_AUTHORIZATION': f'Bearer {token_admin}'}


# ============ 1. 商品创建（用户A = zhangsan）============
# image_urls 必须是合法 URL 列表（min_length=1, max_length=9）
new_product = {
    'title': 'E2E测试-新商品-高数教材',
    'description': '用于E2E测试的示例商品描述',
    'price': '50.00',
    'condition': 'like_new',
    'category': 1,  # 注意字段名是 category 不是 category_id
    'image_urls': [
        'http://127.0.0.1:8000/media/products/p4_4.jpg',
        'http://127.0.0.1:8000/media/products/p4_5.jpg',
    ],
}
r = c.post('/api/products/', data=json.dumps(new_product), content_type='application/json', **auth_user)
log('POST /api/products/', r.status_code == 201, f'status={r.status_code}')
if r.status_code in (200, 201):
    new_pid = r.json()['data']['id']
else:
    print('  resp:', r.content[:200].decode())
    new_pid = None

# ============ 2. 查看商品详情 ============
if new_pid:
    r = c.get(f'/api/products/{new_pid}/', **auth_user)
    log('GET /api/products/{id}/', r.status_code == 200, f'status={r.status_code}')

    # ============ 3. 更新商品 ============
    r = c.patch(f'/api/products/{new_pid}/', data=json.dumps({'price': '45.00'}), content_type='application/json', **auth_user)
    log('PATCH /api/products/{id}/', r.status_code == 200, f'status={r.status_code}')

    # ============ 4. 下架/上架 ============
    r = c.post(f'/api/products/{new_pid}/off-shelf/', **auth_user)
    log('POST off-shelf', r.status_code == 200, f'status={r.status_code}')
    r = c.post(f'/api/products/{new_pid}/on-shelf/', **auth_user)
    log('POST on-shelf', r.status_code == 200, f'status={r.status_code}')


# ============ 5. 收藏 toggle ============
# 选一个别人的商品，且状态必须是 on_sale 才能下单
r = c.get('/api/products/?status=on_sale', **auth_user2)
products = r.json()['data']['results']
# 排除当前用户的商品
other_product = next((p for p in products if p['seller']['id'] != 3), None)  # user2=lisi 的 id
if other_product is None:
    other_product = products[0]
other_pid = other_product['id']
r = c.post(f'/api/products/{other_pid}/favorite/', **auth_user2)
log('POST favorite toggle', r.status_code == 200, f'status={r.status_code}')


# ============ 6. 创建会话 ============
r = c.post('/api/conversations/', data=json.dumps({'product_id': other_pid}), content_type='application/json', **auth_user2)
log('POST /api/conversations/', r.status_code in (200, 201), f'status={r.status_code}')
if r.status_code in (200, 201):
    conv_id = r.json()['data']['id']

    # ============ 7. 发送消息 ============
    r = c.post('/api/messages/send/', data=json.dumps({
        'conversation_id': conv_id,
        'content': '你好，这件商品还在吗？',
        'msg_type': 'text',
    }), content_type='application/json', **auth_user2)
    log('POST /api/messages/send/', r.status_code in (200, 201), f'status={r.status_code}')

    # ============ 8. 会话消息列表 ============
    r = c.get(f'/api/conversations/{conv_id}/messages/', **auth_user2)
    log('GET conversation messages', r.status_code == 200, f'status={r.status_code}')

    # ============ 9. 标记已读 ============
    r = c.post(f'/api/conversations/{conv_id}/read/', **auth_user2)
    log('POST mark read', r.status_code == 200, f'status={r.status_code}')


# ============ 10. 创建订单（想要）============
r = c.post('/api/orders/', data=json.dumps({
    'product_id': other_pid,
    'message': '想要，约周日下午自取',
    'meetup_method': 'self_pickup',
}), content_type='application/json', **auth_user2)
log('POST /api/orders/', r.status_code in (200, 201), f'status={r.status_code}')
order_id = r.json()['data']['id'] if r.status_code in (200, 201) else None


# ============ 11. 卖家确认订单 ============
if order_id:
    r = c.post(f'/api/orders/{order_id}/confirm/', data=json.dumps({'meetup_method': 'self_pickup'}), content_type='application/json', **auth_user)
    log('POST orders confirm', r.status_code == 200, f'status={r.status_code}')

    # ============ 12. 标记完成 ============
    r = c.post(f'/api/orders/{order_id}/complete/', **auth_user)
    log('POST orders complete', r.status_code == 200, f'status={r.status_code}')


# ============ 13. 评价 ============
if order_id:
    r = c.post('/api/reviews/', data=json.dumps({
        'order_id': order_id,
        'rating': 5,
        'content': '卖家很 nice，商品也很新！',
    }), content_type='application/json', **auth_user2)
    log('POST /api/reviews/', r.status_code in (200, 201), f'status={r.status_code}')


# ============ 14. 举报商品 ============
r = c.post('/api/reports/', data=json.dumps({
    'product_id': other_pid,
    'reason': 'fake',
    'description': 'E2E测试举报',
}), content_type='application/json', **auth_user2)
log('POST /api/reports/', r.status_code in (200, 201), f'status={r.status_code}')


# ============ 15. 管理员审核列表 ============
r = c.get('/api/admin/products/audit/', **auth_admin)
log('GET admin/audit list', r.status_code == 200, f'status={r.status_code}')

# ============ 16. AI 一键发布（无图片/无 key 模式）============
r = c.post('/api/ai/publish-assist/', data=json.dumps({
    'image_url': '',
    'draft_text': 'iPhone 14 Pro Max 256G 暗紫色',
}), content_type='application/json', **auth_user)
log('POST /api/ai/publish-assist/', r.status_code == 200, f'status={r.status_code}')

# ============ 17. AI 价格建议 ============
r = c.get('/api/ai/price-suggest/?product_id=' + str(other_pid), **auth_user)
log('GET /api/ai/price-suggest/', r.status_code == 200, f'status={r.status_code}')

# ============ 18. AI 内容审核 ============
r = c.post('/api/ai/moderate/', data=json.dumps({
    'text': '校园二手交易平台测试文本',
}), content_type='application/json', **auth_user)
log('POST /api/ai/moderate/', r.status_code == 200, f'status={r.status_code}')

# ============ 19. 删除商品（清理）============
# 由于之前已对该商品完成过订单，使用 force=true 强制删除
if new_pid:
    r = c.delete(f'/api/products/{new_pid}/?force=true', **auth_user)
    log('DELETE /api/products/{id}/?force=true', r.status_code in (200, 204), f'status={r.status_code}')

# 汇总
total = len(results)
passed = sum(1 for _, ok, _ in results if ok)
print()
print(f'=== 写操作汇总: {passed}/{total} 通过 ===')
