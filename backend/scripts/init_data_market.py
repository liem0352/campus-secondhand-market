r"""
初始化数据脚本 — 校园二手交易平台

执行方式（PowerShell）：
    1) 先建库（首次或库被删后）：
         "C:\Program Files\MySQL\MySQL Server 9.4\bin\mysql.exe" -u root -ptyb1124 `
             < "d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\backend\scripts\create_mysql_db.sql"
    2) 再做 migrate：
         python manage.py migrate
    3) 最后跑本脚本：
         C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe scripts\init_data_market.py

初始化内容：
    1) 商品分类（一级 5 个 + 二级约 19 个）
    2) 测试账号（admin / zhangsan / lisi / wangwu，密码已哈希）
    3) 示例商品（约 22 条，覆盖教材 / 数码 / 服饰 / 生活 / 其他）
    4) 示例举报 1 条（用于演示管理后台）

幂等性：
    所有数据均通过 get_or_create / exists 判定重复，可重复执行。
"""
import os
import random
import sys
from datetime import timedelta
from decimal import Decimal

import django
from django.utils import timezone

# ----- 1) 引导 Django 运行环境 -----
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# ----- 2) 业务导入（必须在 django.setup 之后） -----
from market.models import (  # noqa: E402
    AuditLog,
    Category,
    Conversation,
    Favorite,
    Message,
    Order,
    Product,
    ProductImage,
    Report,
    Review,
    User,
)


# ---------------------------------------------------------------------------
# 分类配置：一级 5 个 + 二级若干
# ---------------------------------------------------------------------------
TOP_CATEGORIES = [
    # (code, name, sort_order)
    ('textbook', '教材', 1),
    ('digital', '数码', 2),
    ('fashion', '服饰', 3),
    ('life', '生活', 4),
    ('other', '其他', 99),
]

# 二级分类：{ 一级 code: [(sub_code, sub_name, sort_order), ...] }
SUB_CATEGORIES = {
    'textbook': [
        ('textbook_uni', '大学教材', 1),
        ('textbook_post', '考研资料', 2),
        ('textbook_lang', '语言学习', 3),
        ('textbook_exam', '考试认证', 4),
    ],
    'digital': [
        ('digital_phone', '手机', 1),
        ('digital_pc', '电脑', 2),
        ('digital_pad', '平板', 3),
        ('digital_acc', '配件', 4),
        ('digital_cam', '相机', 5),
    ],
    'fashion': [
        ('fashion_men', '男装', 1),
        ('fashion_women', '女装', 2),
        ('fashion_shoe', '鞋包', 3),
        ('fashion_acc', '配饰', 4),
    ],
    'life': [
        ('life_dorm', '宿舍用品', 1),
        ('life_beauty', '美妆个护', 2),
        ('life_sport', '运动户外', 3),
        ('life_food', '食品', 4),
    ],
    'other': [
        ('other_misc', '其他', 1),
    ],
}


# ---------------------------------------------------------------------------
# 测试用户配置
# ---------------------------------------------------------------------------
TEST_USERS = [
    {
        'username': 'admin',
        'password': 'admin123',
        'nickname': '管理员',
        'role': 'admin',
        'credit_score': 100,
        'school': '示例大学',
        'is_staff': True,
        'is_superuser': True,
        'student_id': '',
    },
    {
        'username': 'zhangsan',
        'password': '123456',
        'nickname': '张三',
        'role': 'user',
        'credit_score': 85,
        'school': '示例大学',
        'is_staff': False,
        'is_superuser': False,
        'student_id': '2023001',
    },
    {
        'username': 'lisi',
        'password': '123456',
        'nickname': '李四',
        'role': 'user',
        'credit_score': 92,
        'school': '示例大学',
        'is_staff': False,
        'is_superuser': False,
        'student_id': '2023002',
    },
    {
        'username': 'wangwu',
        'password': '123456',
        'nickname': '王五',
        'role': 'user',
        'credit_score': 78,
        'school': '示例大学',
        'is_staff': False,
        'is_superuser': False,
        'student_id': '2023003',
    },
]


# ---------------------------------------------------------------------------
# 示例商品模板：(title, cat_code, price, original, condition, status, description)
# ---------------------------------------------------------------------------
PRODUCT_TEMPLATES = [
    # ----- 教材 -----
    ('高等数学（同济第七版）上下册', 'textbook_uni', 25, 78, 'good', 'on_sale', '使用一学期，保存完好，笔记少。'),
    ('线性代数（同济版）+ 习题解答', 'textbook_uni', 18, 56, 'like_new', 'on_sale', '附赠习题解答，几乎全新。'),
    ('考研英语真题 2024 版', 'textbook_post', 15, 50, 'like_new', 'on_sale', '仅写过几道题，几乎全新。'),
    ('考研政治冲刺笔记（手写）', 'textbook_post', 20, 0, 'like_new', 'on_sale', '手写笔记，重点清晰。'),
    ('新概念英语第二册', 'textbook_lang', 8, 28, 'good', 'on_sale', '经典教材，听力文件可赠送。'),
    ('计算机二级题库', 'textbook_exam', 12, 35, 'like_new', 'on_sale', '去年考过，全套完整。'),
    ('英语四六级耳机', 'textbook_exam', 18, 50, 'good', 'sold', '考试专用，调频准确。'),

    # ----- 数码 -----
    ('iPhone 13 128G 星光色', 'digital_phone', 2800, 5999, 'like_new', 'on_sale', '自用 9 成新，无磕碰，电池效率 89%。'),
    ('小米 13 Pro 256G', 'digital_phone', 2200, 4999, 'good', 'on_sale', '功能正常，外观有轻微划痕。'),
    ('联想小新 Pro 14', 'digital_pc', 3800, 6500, 'like_new', 'on_sale', 'i5 处理器，16G 内存，2023 年购入。'),
    ('iPad Air 5 64G', 'digital_pad', 3200, 4799, 'like_new', 'sold', '配原装保护壳，已贴膜。'),
    ('AirPods Pro 二代', 'digital_acc', 800, 1899, 'like_new', 'on_sale', '刚买两个月，全套配件。'),
    ('索尼 A6400 微单', 'digital_cam', 4200, 7200, 'good', 'on_sale', '原装电池两块，16-50 套机。'),

    # ----- 服饰 -----
    ('优衣库摇粒绒外套男 L', 'fashion_men', 60, 199, 'like_new', 'on_sale', '去年冬季穿过几次，几乎全新。'),
    ('ZARA 白色连衣裙 S', 'fashion_women', 80, 299, 'like_new', 'on_sale', '只穿过一次拍照用。'),
    ('耐克 Air Force 1 42 码', 'fashion_shoe', 200, 799, 'good', 'sold', '穿过半年，无破损。'),
    ('卡西欧 G-Shock 腕表', 'fashion_acc', 280, 1090, 'like_new', 'on_sale', '自用两个月，电池正常。'),

    # ----- 生活 -----
    ('小米台灯 Pro', 'life_dorm', 80, 199, 'like_new', 'on_sale', '宿舍神器，可调色温。'),
    ('雅诗兰黛小棕瓶 50ml', 'life_beauty', 350, 880, 'new', 'on_sale', '专柜购入，未拆封。'),
    ('迪卡侬瑜伽垫 6mm', 'life_sport', 30, 89, 'good', 'on_sale', '用过几次，无破损。'),
    ('进口巧克力礼盒', 'life_food', 25, 88, 'new', 'pending', '保质期 6 个月，可小刀。'),

    # ----- 其他 -----
    ('宿舍折叠桌', 'other_misc', 35, 79, 'good', 'on_sale', '可折叠，不占空间。'),
    ('蓝牙音箱 JBL Go 3', 'other_misc', 120, 299, 'like_new', 'on_sale', '声音洪亮，续航好。'),
]


# ---------------------------------------------------------------------------
# 业务函数
# ---------------------------------------------------------------------------
def create_categories():
    """创建商品分类（一级 + 二级），返回 ``{code: Category}`` 映射。"""
    print('\n========== 创建商品分类 ==========')
    code_map = {}

    for code, name, sort_order in TOP_CATEGORIES:
        cat, created = Category.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'parent': None,
                'sort_order': sort_order,
                'is_active': True,
                'icon': '',
            },
        )
        code_map[code] = cat
        flag = '创建' if created else '已存在'
        print(f'  [{flag}] 一级: {cat.name} ({cat.code})')

    for parent_code, subs in SUB_CATEGORIES.items():
        parent = code_map[parent_code]
        for sub_code, sub_name, sort_order in subs:
            cat, created = Category.objects.get_or_create(
                code=sub_code,
                defaults={
                    'name': sub_name,
                    'parent': parent,
                    'sort_order': sort_order,
                    'is_active': True,
                    'icon': '',
                },
            )
            code_map[sub_code] = cat
            flag = '创建' if created else '已存在'
            print(f'  [{flag}] 二级: {parent.name} > {cat.name} ({cat.code})')

    return code_map


def create_users():
    """创建测试用户（admin / zhangsan / lisi / wangwu），返回 ``{username: User}`` 映射。

    说明：
        AbstractUser 没有 ``nickname`` 字段（只有 ``first_name`` / ``last_name``），
        因此 ``nickname`` 写入 ``first_name``，便于前端展示"昵称"。

    """
    print('\n========== 创建测试用户 ==========')
    user_map = {}

    for spec in TEST_USERS:
        username = spec['username']
        password = spec['password']
        nickname = spec.get('nickname', '')

        # 写入数据库的字段（排除 password / nickname）
        defaults = {k: v for k, v in spec.items() if k not in ('username', 'password', 'nickname')}
        defaults['is_active'] = True
        defaults['is_certified'] = True
        # 用 first_name 存昵称
        defaults['first_name'] = nickname

        user, created = User.objects.get_or_create(
            username=username,
            defaults=defaults,
        )
        if created:
            # 首次创建：写入密码哈希
            user.set_password(password)
            user.save()
        else:
            # 已存在：刷新关键字段，避免改了 spec 之后未生效
            updated = False
            for k, v in defaults.items():
                if getattr(user, k) != v:
                    setattr(user, k, v)
                    updated = True
            if updated:
                user.save()

        user_map[username] = user
        flag = '创建' if created else '已存在'
        print(f'  [{flag}] {username} (role={user.role}, credit={user.credit_score})')

    return user_map


def create_products(users, categories):
    """按 PRODUCT_TEMPLATES 创建示例商品，约 22 条。"""
    print('\n========== 创建示例商品 ==========')
    # 三个学生轮流当卖家
    sellers = [users['zhangsan'], users['lisi'], users['wangwu']]

    # 固定随机种子，便于重复执行结果一致
    random.seed(42)

    created_count = 0
    for idx, (title, cat_code, price, original, cond, status, desc) in enumerate(PRODUCT_TEMPLATES):
        category = categories.get(cat_code)
        if not category:
            print(f'  [跳过] 分类 {cat_code} 不存在: {title}')
            continue

        seller = sellers[idx % len(sellers)]

        # 避免重复
        if Product.objects.filter(title=title, seller=seller).exists():
            print(f'  [已存在] {title} ({seller.username})')
            continue

        product = Product.objects.create(
            seller=seller,
            category=category,
            title=title,
            description=desc,
            price=Decimal(str(price)),
            original_price=Decimal(str(original)) if original else None,
            condition=cond,
            status=status,
            school=seller.school or '示例大学',
            view_count=random.randint(10, 500),
            favorite_count=random.randint(0, 50),
        )

        # 1-3 张占位图，使用 picsum.photos 提供可访问图片
        img_count = random.randint(1, 3)
        for i in range(img_count):
            ProductImage.objects.create(
                product=product,
                image_url=f'https://picsum.photos/seed/{product.id * 10 + i}/400/400',
                sort_order=i,
            )

        created_count += 1
        print(f'  [创建] #{product.id} {title[:30]} ¥{price} ({status}) by {seller.username}')

    print(f'  共新建 {created_count} 件商品')
    return created_count


def create_reports(users):
    """创建一条示例举报，便于管理后台演示。"""
    print('\n========== 创建示例举报 ==========')
    product = Product.objects.filter(status='on_sale').first()
    if not product:
        print('  [跳过] 无在售商品可供举报')
        return 0

    reporter = users['lisi']
    if Report.objects.filter(reporter=reporter, product=product).exists():
        print('  [已存在] 举报记录')
        return 0

    Report.objects.create(
        reporter=reporter,
        product=product,
        reason='price',
        description='该商品价格明显低于市场正常价，怀疑是引流或假货，请核实。',
        status='pending',
    )
    print(f'  [创建] {reporter.username} 举报 #{product.id} {product.title[:20]}')
    return 1


# ---------------------------------------------------------------------------
# 业务数据：订单 / 收藏 / 消息 / 评价 / 审计日志
# ---------------------------------------------------------------------------
#   设计目标:
#   1) 让 demo 账号(zhangsan / lisi / wangwu)登录后,所有业务页面都有数据:
#      - 我的收藏       : 收藏对方在售商品
#      - 我买到的       : 对方向我售出的订单(各状态)
#      - 卖出订单       : 我向对方售出的订单(各状态)
#      - 消息中心       : 私聊会话 + 消息
#      - 销售看板       : 卖家侧每日成交趋势
#   2) 数据按时间倒序覆盖最近 30 天,确保 7/30/90 天窗口都有数据
#   3) 幂等:全部用 unique / exists 判定,可重复执行
# ---------------------------------------------------------------------------

# 状态机时间分布(天数偏移,- 表示过去):让 30 天内每天都有成交
ORDER_DAYS_SCATTER = [0, 1, 2, 3, 4, 5, 6, 7, 9, 11, 13, 15, 17, 20, 23, 26, 28]


def create_orders(users):
    """为 demo 三人组互为买卖方创建订单,覆盖全部状态机。

    状态分布(约 18 笔):
      requested   3  买家刚申请
      confirmed   3  卖家已确认
      shipping    2  待取/待发
      completed   7  已完成(供销售看板 trend 使用)
      cancelled   3  已取消
    """
    print('\n========== 创建示例订单 ==========')
    # 三人组互为买卖
    pairs = [
        ('zhangsan', 'lisi'),    # 张三买李四的
        ('zhangsan', 'wangwu'),   # 张三买王五的
        ('lisi', 'zhangsan'),     # 李四买张三的
        ('lisi', 'wangwu'),       # 李四买王五的
        ('wangwu', 'zhangsan'),   # 王五买张三的
        ('wangwu', 'lisi'),       # 王五买李四的
    ]

    # 取每对中"卖方"的在售/已售商品若干,作为订单标的
    plan = []  # (buyer, seller, product, status, days_ago)
    for buyer_name, seller_name in pairs:
        seller = users[seller_name]
        products = list(
            Product.objects.filter(seller=seller, status__in=['on_sale', 'sold']).order_by('id')[:3]
        )
        if not products:
            continue
        for idx, p in enumerate(products):
            # 轮转分配状态
            slot = (len(plan)) % 18
            status = [
                'requested', 'requested', 'requested',
                'confirmed', 'confirmed', 'confirmed',
                'shipping', 'shipping',
                'completed', 'completed', 'completed', 'completed',
                'completed', 'completed', 'completed',
                'cancelled', 'cancelled', 'cancelled',
            ][slot]
            days_ago = ORDER_DAYS_SCATTER[slot] if slot < len(ORDER_DAYS_SCATTER) else slot
            plan.append((users[buyer_name], seller, p, status, days_ago))

    created = 0
    for buyer, seller, product, status, days_ago in plan:
        # 幂等:同 (buyer, product) 视为同一笔订单
        if Order.objects.filter(buyer=buyer, product=product).exists():
            continue

        now = timezone.now()
        created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))
        completed_at = (
            created_at + timedelta(hours=random.randint(2, 48)) if status == 'completed' else None
        )
        order = Order.objects.create(
            product=product,
            buyer=buyer,
            seller=seller,
            status=status,
            shipping_method=random.choice(['pickup', 'pickup', 'express']),
            price=product.price,
            note=random.choice([
                '希望能尽快发货',
                '可以小刀吗',
                '下午自取',
                '请发顺丰',
                '想要加急',
                '',
            ]),
            pickup_location=random.choice(['宿舍楼下', '图书馆门口', '食堂西门', '教学楼 A 座']),
            pickup_time=created_at + timedelta(days=2) if status in ('confirmed', 'shipping', 'completed') else None,
            created_at=created_at,
            updated_at=created_at,
            completed_at=completed_at,
        )
        # 手动写回 updated_at(因 auto_now 会覆盖)
        Order.objects.filter(pk=order.pk).update(updated_at=created_at + timedelta(hours=1))
        created += 1
        print(f'  [创建] #{order.id} {buyer.username} 买 {seller.username} 的 #{product.id} {product.title[:18]} ({status}, {days_ago}d)')

    print(f'  共新建 {created} 笔订单')
    return created


def create_favorites(users):
    """为每人收藏对方在售商品各 3-5 个。"""
    print('\n========== 创建示例收藏 ==========')
    pairs = [
        ('zhangsan', 'lisi'),
        ('zhangsan', 'wangwu'),
        ('lisi', 'zhangsan'),
        ('lisi', 'wangwu'),
        ('wangwu', 'zhangsan'),
        ('wangwu', 'lisi'),
    ]
    created = 0
    for fan_name, seller_name in pairs:
        fan = users[fan_name]
        seller = users[seller_name]
        products = list(
            Product.objects.filter(seller=seller, status='on_sale').order_by('?')[:4]
        )
        for idx, p in enumerate(products):
            if Favorite.objects.filter(user=fan, product=p).exists():
                continue
            Favorite.objects.create(
                user=fan,
                product=p,
                created_at=timezone.now() - timedelta(days=random.randint(0, 25), hours=random.randint(0, 23)),
            )
            created += 1
    print(f'  共新建 {created} 条收藏')
    return created


def create_messages(users):
    """为每人创建 2-3 个私聊会话,每个会话 4-8 条消息。"""
    print('\n========== 创建示例消息 ==========')
    pairs = [
        ('zhangsan', 'lisi'),
        ('zhangsan', 'wangwu'),
        ('lisi', 'zhangsan'),
        ('lisi', 'wangwu'),
        ('wangwu', 'zhangsan'),
        ('wangwu', 'lisi'),
    ]
    created_conv = 0
    created_msg = 0
    for a_name, b_name in pairs:
        a = users[a_name]
        b = users[b_name]
        # 选 a 收藏过 b 的某个商品作为会话主题
        product = (
            Product.objects.filter(seller=b, favorited_by__user=a).order_by('?').first()
            or Product.objects.filter(seller=b, status='on_sale').order_by('?').first()
        )
        if not product:
            continue

        # 幂等:同 (product, buyer) 唯一
        conv, made = Conversation.objects.get_or_create(
            product=product, buyer=a,
            defaults={'seller': b},
        )
        if made:
            created_conv += 1

        # 跳过已存在消息的会话(避免重复)
        if conv.messages.exists():
            # 仍然更新 last_message 字段,便于列表展示
            last = conv.messages.order_by('-created_at').first()
            conv.last_message = last.content[:200]
            conv.last_message_at = last.created_at
            conv.unread_buyer = random.randint(0, 2)
            conv.unread_seller = random.randint(0, 1)
            conv.save()
            continue

        # 生成 4-8 条对话
        scripts = [
            ('你好,这个还有货吗?', 'buyer'),
            ('有的,随时可以交易', 'seller'),
            ('可以小刀一下吗?', 'buyer'),
            ('可以便宜 5 块,不能再少了', 'seller'),
            ('好的,什么时候方便交易?', 'buyer'),
            ('明天下午图书馆门口?', 'seller'),
            ('OK,三点见', 'buyer'),
        ]
        n = random.randint(4, len(scripts))
        chosen = random.sample(scripts, n)
        base_time = timezone.now() - timedelta(days=random.randint(0, 20), hours=random.randint(0, 23))
        for i, (text, role) in enumerate(chosen):
            sender = a if role == 'buyer' else b
            msg = Message.objects.create(
                conversation=conv,
                sender=sender,
                content=text,
                is_read=random.random() > 0.4,
                created_at=base_time + timedelta(minutes=i * random.randint(2, 30)),
            )
            created_msg += 1

        # 更新会话摘要字段
        last = conv.messages.order_by('-created_at').first()
        conv.last_message = last.content[:200]
        conv.last_message_at = last.created_at
        conv.unread_buyer = conv.messages.filter(is_read=False, sender=b).count()
        conv.unread_seller = conv.messages.filter(is_read=False, sender=a).count()
        conv.save()

    print(f'  共新建 {created_conv} 个会话, {created_msg} 条消息')
    return created_conv, created_msg


def create_reviews(users):
    """为已完成的订单创建评价,每人给另一个人 1-2 条 5 星好评。"""
    print('\n========== 创建示例评价 ==========')
    completed = Order.objects.filter(status='completed').select_related('buyer', 'seller', 'product')
    if not completed.exists():
        print('  [跳过] 无已完成订单可评价')
        return 0

    created = 0
    used = set()
    for order in completed:
        # 买家评价卖家
        if (order.id, 'buyer_to_seller') not in used and not hasattr(order, 'review'):
            if random.random() > 0.3:
                Review.objects.create(
                    order=order,
                    reviewer=order.buyer,
                    reviewee=order.seller,
                    rating=random.choice([5, 5, 5, 4, 4]),
                    content=random.choice([
                        '卖家发货很快,商品和描述一致,推荐!',
                        '沟通顺畅,价格合理,下次再来',
                        '整体很满意,已经收到货',
                        '很 nice 的卖家',
                    ]),
                    created_at=order.completed_at + timedelta(hours=random.randint(1, 24)) if order.completed_at else timezone.now(),
                )
                used.add((order.id, 'buyer_to_seller'))
                created += 1
                continue  # 1 单 1 评
    print(f'  共新建 {created} 条评价')
    return created


def create_audit_logs(users):
    """补 3-5 条管理员操作日志(让审计日志页面也有内容)。"""
    print('\n========== 创建示例审计日志 ==========')
    admin = users.get('admin')
    if not admin:
        print('  [跳过] 无 admin 账号')
        return 0
    plan = [
        ('approve_product', 'product', '审核通过示例商品'),
        ('reject_product', 'product', '驳回信息不全的商品'),
        ('handle_report', 'report', '处理用户举报'),
        ('ban_user', 'user', '封禁违规用户 7 天'),
        ('update_ai_config', 'system', '更新 AI 议价模型阈值'),
    ]
    created = 0
    for i, (action, target_type, remark) in enumerate(plan):
        if AuditLog.objects.filter(action=action, remark=remark).exists():
            continue
        AuditLog.objects.create(
            operator=admin,
            action=action,
            target_type=target_type,
            target_id=random.randint(1, 30),
            remark=remark,
            created_at=timezone.now() - timedelta(days=i, hours=random.randint(0, 12)),
        )
        created += 1
    print(f'  共新建 {created} 条审计日志')
    return created


# ---------------------------------------------------------------------------
# 入口
# ---------------------------------------------------------------------------
def main():
    """主流程：分类 → 用户 → 商品 → 收藏 → 订单 → 消息 → 评价 → 举报 → 审计。"""
    print('=' * 60)
    print('  校园二手交易平台 — 初始化数据')
    print('=' * 60)

    # 1. 分类
    categories = create_categories()

    # 2. 用户
    users = create_users()

    # 3. 商品
    create_products(users, categories)

    # 4. 收藏(需要在商品之后)
    create_favorites(users)

    # 5. 订单(需要在商品之后,已售/在售都参与)
    create_orders(users)

    # 6. 私聊消息(依赖商品 + 收藏)
    create_messages(users)

    # 7. 评价(依赖已完成订单)
    create_reviews(users)

    # 8. 举报
    create_reports(users)

    # 9. 审计日志
    create_audit_logs(users)

    # 10. 统计
    print('\n========== 初始化完成统计 ==========')
    print(f'  一级分类:     {Category.objects.filter(parent__isnull=True).count()}')
    print(f'  二级分类:     {Category.objects.filter(parent__isnull=False).count()}')
    print(f'  用户数:       {User.objects.count()}')
    print(f'  商品数:       {Product.objects.count()}')
    print(f'  在售商品:     {Product.objects.filter(status="on_sale").count()}')
    print(f'  已售商品:     {Product.objects.filter(status="sold").count()}')
    print(f'  待审核:       {Product.objects.filter(status="pending").count()}')
    print(f'  订单数:       {Order.objects.count()}')
    print(f'  已完成订单:   {Order.objects.filter(status="completed").count()}')
    print(f'  收藏数:       {Favorite.objects.count()}')
    print(f'  会话数:       {Conversation.objects.count()}')
    print(f'  消息数:       {Message.objects.count()}')
    print(f'  评价数:       {Review.objects.count()}')
    print(f'  举报数:       {Report.objects.count()}')
    print(f'  审计日志:     {AuditLog.objects.count()}')
    print('=' * 60)
    print('  默认账号：')
    print('    管理员: admin    / admin123')
    print('    学生 1: zhangsan / 123456')
    print('    学生 2: lisi     / 123456')
    print('    学生 3: wangwu   / 123456')
    print('=' * 60)


if __name__ == '__main__':
    main()
