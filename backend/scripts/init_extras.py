r"""
补充示例数据脚本 — 校园二手交易平台

作用：
    在 init_data_market.py 基础上补充：
    1) 示例订单（约 5-8 单，覆盖各种状态：requested/confirmed/shipping/completed/cancelled）
    2) 示例会话与消息（约 3 对会话，每对 3-5 条消息）
    3) 示例收藏（每个学生 3-5 个）
    4) 示例评价（已完成订单配套 1 条评价）
    5) 示例审计日志（约 5 条，用于演示管理后台审计页）

幂等性：
    全部走 exists / get_or_create 判定重复，可重复执行。

执行方式（PowerShell）：
    cd "d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\backend"
    C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe scripts\init_extras.py
"""
import os
import random
import sys
from decimal import Decimal

import django

# ----- 1) 引导 Django 运行环境 -----
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# ----- 2) 业务导入（必须在 django.setup 之后） -----
from django.utils import timezone  # noqa: E402

from market.models import (  # noqa: E402
    AuditLog,
    Conversation,
    Favorite,
    Message,
    Order,
    Product,
    Review,
    User,
)


# ---------------------------------------------------------------------------
# 1) 收藏
# ---------------------------------------------------------------------------
def create_favorites(users):
    """每个学生收藏 3-5 件在售商品。"""
    print('\n========== 创建收藏 ==========')
    buyers = [users['zhangsan'], users['lisi'], users['wangwu']]
    products = list(Product.objects.filter(status='on_sale').order_by('id')[:8])
    if not products:
        print('  [跳过] 无在售商品可收藏')
        return 0

    created = 0
    for buyer in buyers:
        # 排除自己卖出的商品
        candidates = [p for p in products if p.seller_id != buyer.id]
        sample = random.sample(candidates, min(3, len(candidates)))
        for p in sample:
            _, was_created = Favorite.objects.get_or_create(user=buyer, product=p)
            if was_created:
                p.favorite_count = (p.favorite_count or 0) + 1
                p.save(update_fields=['favorite_count'])
                created += 1
    print(f'  共新建 {created} 条收藏')
    return created


# ---------------------------------------------------------------------------
# 2) 订单（覆盖全部状态机）
# ---------------------------------------------------------------------------
def create_orders(users):
    """示例订单：requested / confirmed / shipping / completed / cancelled 都要覆盖。"""
    print('\n========== 创建订单 ==========')
    zhangsan = users['zhangsan']
    lisi = users['lisi']
    wangwu = users['wangwu']
    admin = users['admin']

    # 找出几件在售商品，分别扮演不同买家
    products = list(Product.objects.filter(status='on_sale').order_by('id')[:6])
    if len(products) < 3:
        print('  [跳过] 在售商品不足 3 件')
        return 0

    plans = [
        # (buyer, seller, product, status, shipping_method, note, days_ago, completed?)
        (lisi, products[0].seller, products[0], 'completed', 'pickup', '面交顺利，谢谢！', 5, True),
        (wangwu, products[1].seller, products[1], 'shipping', 'express', '已发顺丰，3 天到', 2, False),
        (zhangsan, products[2].seller, products[2], 'confirmed', 'pickup', '图书馆门口取', 1, False),
        (wangwu, products[3].seller, products[3], 'requested', 'pickup', '可以小刀吗？', 0, False),
        (lisi, products[4].seller, products[4], 'cancelled', 'pickup', '暂时不需要了', 3, False),
    ]

    created = 0
    for buyer, seller, product, status, shipping, note, days_ago, completed in plans:
        if Order.objects.filter(buyer=buyer, product=product, status=status).exists():
            print(f'  [已存在] {buyer.username} -> {product.title[:20]} ({status})')
            continue

        # 跳过"自买自卖"
        if buyer.id == seller.id:
            continue

        order = Order.objects.create(
            product=product,
            buyer=buyer,
            seller=seller,
            status=status,
            shipping_method=shipping,
            price=product.price,
            note=note,
            pickup_location='示例大学图书馆门口' if shipping == 'pickup' else '',
            pickup_time=timezone.now() + timezone.timedelta(days=2) if shipping == 'pickup' and status in ('requested', 'confirmed') else None,
        )
        # 手动调整创建时间（用于演示数据时间分布）
        order.created_at = timezone.now() - timezone.timedelta(days=days_ago)
        if completed and status == 'completed':
            order.completed_at = order.created_at + timezone.timedelta(hours=12)
        order.save()

        # 已售商品 -> 标记
        if status == 'completed':
            product.status = 'sold'
            product.save(update_fields=['status'])

        created += 1
        print(f'  [创建] #{order.id} {buyer.username} -> {product.title[:20]} ({status})')

    print(f'  共新建 {created} 个订单')
    return created


# ---------------------------------------------------------------------------
# 3) 会话 + 消息
# ---------------------------------------------------------------------------
def create_conversations(users):
    """3 对会话，每对 3-5 条消息。"""
    print('\n========== 创建会话与消息 ==========')
    zhangsan = users['zhangsan']
    lisi = users['lisi']
    wangwu = users['wangwu']

    # 取几件在售商品
    products = list(Product.objects.filter(status='on_sale').order_by('id')[:3])
    if not products:
        print('  [跳过] 无在售商品')
        return 0

    # 配对：(买家, 卖家, 商品, 消息脚本)
    pairs = [
        (lisi, zhangsan, products[0] if products[0].seller_id == zhangsan.id else products[1], [
            ('buyer', '你好，这件还在吗？'),
            ('seller', '在的，可以小刀一点点。'),
            ('buyer', '方便自取吗？什么时候有空？'),
            ('seller', '明天下午图书馆门口。'),
        ]),
        (wangwu, lisi, products[1] if products[1].seller_id == lisi.id else products[0], [
            ('buyer', '可以便宜点吗？'),
            ('seller', '已经是最低价啦～'),
            ('buyer', '好吧，那什么时候能看？'),
        ]),
        (zhangsan, wangwu, products[2] if products[2].seller_id == wangwu.id else products[0], [
            ('buyer', '实物和图片一致吗？'),
            ('seller', '完全一致，9 成新。'),
            ('buyer', '好的，下单了。'),
            ('seller', '收到！'),
        ]),
    ]

    created = 0
    for buyer, seller, product, msgs in pairs:
        if buyer.id == seller.id:
            continue

        conv, was_created = Conversation.objects.get_or_create(
            product=product,
            buyer=buyer,
            seller=seller,
        )
        if not was_created and conv.messages.count() >= len(msgs):
            print(f'  [已存在] 会话 #{conv.id}')
            continue

        # 写入消息
        for i, (role, text) in enumerate(msgs):
            sender = buyer if role == 'buyer' else seller
            Message.objects.get_or_create(
                conversation=conv,
                sender=sender,
                content=text,
                defaults={'is_read': True if i < len(msgs) - 1 else False},
            )
        created += 1
        print(f'  [创建] 会话 #{conv.id} ({buyer.username} <-> {seller.username})')

    print(f'  共新建 {created} 个会话')
    return created


# ---------------------------------------------------------------------------
# 4) 评价（针对已完成的订单）
# ---------------------------------------------------------------------------
def create_reviews(users):
    """为已完成的订单添加评价。"""
    print('\n========== 创建评价 ==========')
    completed_orders = Order.objects.filter(status='completed').select_related('buyer', 'seller')
    if not completed_orders.exists():
        print('  [跳过] 无已完成订单')
        return 0

    review_templates = [
        (5, '卖家很 nice，商品描述准确，强烈推荐！'),
        (5, '交易顺利，沟通及时，好评！'),
        (4, '整体不错，就是发货稍慢。'),
    ]

    created = 0
    for i, order in enumerate(completed_orders[:3]):
        if Review.objects.filter(order=order).exists():
            print(f'  [已存在] 订单 #{order.id} 评价')
            continue
        score, content = review_templates[i % len(review_templates)]
        Review.objects.create(
            order=order,
            reviewer=order.buyer,
            reviewee=order.seller,
            rating=score,
            content=content,
        )
        created += 1
        print(f'  [创建] {order.buyer.username} 评价 {order.seller.username} ({score}★)')
    print(f'  共新建 {created} 条评价')
    return created


# ---------------------------------------------------------------------------
# 5) 审计日志
# ---------------------------------------------------------------------------
def create_audit_logs(users):
    """示例审计日志。"""
    print('\n========== 创建审计日志 ==========')
    admin = users['admin']

    # (action, target_type, target_id, remark, days_ago)
    logs_spec = [
        ('ban_user', 'user', 2, '违反平台规则', 5),
        ('adjust_credit', 'user', 3, '积极回复消息 +5 分', 4),
        ('approve_product', 'product', 15, '审核通过：iPhone 13 128G', 3),
        ('reject_product', 'product', 18, '信息不全：描述不清', 2),
        ('handle_report', 'report', 1, '价格异常，已警告卖家', 1),
        ('off_shelf_product', 'product', 22, '重复发布：内容与商品 #15 一致', 0),
    ]

    created = 0
    for action, target_type, target_id, remark, days_ago in logs_spec:
        if AuditLog.objects.filter(
            operator=admin,
            action=action,
            target_type=target_type,
            target_id=target_id,
        ).exists():
            print(f'  [已存在] {action} {target_type}#{target_id}')
            continue
        log = AuditLog.objects.create(
            operator=admin,
            action=action,
            target_type=target_type,
            target_id=target_id,
            remark=remark,
        )
        # 调整 created_at（auto_now_add 会被覆盖回 timezone.now，需 update）
        from django.utils import timezone as _tz
        AuditLog.objects.filter(pk=log.pk).update(
            created_at=_tz.now() - _tz.timedelta(days=days_ago)
        )
        created += 1
    print(f'  共新建 {created} 条审计日志')
    return created


# ---------------------------------------------------------------------------
# 入口
# ---------------------------------------------------------------------------
def main():
    print('=' * 60)
    print('  校园二手交易平台 — 补充示例数据')
    print('=' * 60)

    # 加载用户
    users = {u.username: u for u in User.objects.filter(username__in=['admin', 'zhangsan', 'lisi', 'wangwu'])}
    if len(users) < 4:
        print('  [错误] 请先执行 init_data_market.py 初始化基础用户')
        return 1

    # 1. 收藏
    create_favorites(users)

    # 2. 订单
    create_orders(users)

    # 3. 会话与消息
    create_conversations(users)

    # 4. 评价
    create_reviews(users)

    # 5. 审计日志
    create_audit_logs(users)

    # 总览
    print('\n========== 补充数据完成 ==========')
    print(f'  用户数:   {User.objects.count()}')
    print(f'  商品数:   {Product.objects.count()}')
    print(f'  在售商品: {Product.objects.filter(status="on_sale").count()}')
    print(f'  已售商品: {Product.objects.filter(status="sold").count()}')
    print(f'  收藏数:   {Favorite.objects.count()}')
    print(f'  订单数:   {Order.objects.count()}')
    print(f'  已完成订单: {Order.objects.filter(status="completed").count()}')
    print(f'  会话数:   {Conversation.objects.count()}')
    print(f'  消息数:   {Message.objects.count()}')
    print(f'  评价数:   {Review.objects.count()}')
    print(f'  审计日志: {AuditLog.objects.count()}')
    print('=' * 60)
    return 0


if __name__ == '__main__':
    sys.exit(main())
