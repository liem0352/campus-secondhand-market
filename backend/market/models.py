"""
ORM 模型 — 校园二手交易平台核心数据表

本模块定义 market App 全部 11 个模型，按依赖顺序排列：
    1) User              自定义用户，继承 AbstractUser（settings.AUTH_USER_MODEL）
    2) Category          商品分类（自引用支持一级 + 二级）
    3) Product           商品（含状态机字段）
    4) ProductImage      商品图片（最多 9 张）
    5) Favorite          收藏（用户-商品 多对多）
    6) Conversation      会话（基于商品的私聊）
    7) Message           私聊消息
    8) Order             订单（基于"想要"的状态机）
    9) Review            评价
    10) Report           举报
    11) AuditLog         管理员操作日志

设计要点：
- 全部模型显式声明 ``db_table``，避免 Django 默认命名风格与现有 MySQL 库冲突；
- ``verbose_name`` 中文，方便 Django Admin 与日志中识别；
- ``User`` 继承 ``AbstractUser``，通过 settings.AUTH_USER_MODEL = 'market.User' 接入 Django 鉴权；
- 字段命名遵循 market/authentication.py + market/permissions.py 已引用的约定
  （如 ``role`` / ``is_active`` / ``is_authenticated`` / ``pk`` 等）。
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


# ---------------------------------------------------------------------------
# 1) User — 校园二手交易平台用户
# ---------------------------------------------------------------------------
class User(AbstractUser):
    """校园二手交易平台用户模型。

    函数功能：
        - 继承 ``django.contrib.auth.models.AbstractUser``，自带 ``username`` /
          ``email`` / ``password`` / ``is_active`` / ``date_joined`` / ``last_login``
          等通用鉴权字段；
        - 扩展校园场景属性：学校 / 学号 / 信用分 / 头像 / 个人简介 / 角色 / 校园认证；
        - 通过 ``settings.AUTH_USER_MODEL = 'market.User'`` 注册为 Django 项目的
          唯一用户模型，SimpleJWT 与 Admin 都会从此处取用户。

    字段说明：
        school         学校名称（冗余存储，便于按学校过滤商品 / 统计）
        student_id     学号（校园认证依据）
        credit_score   信用分，0-100 区间，初始 80，越高越可信
        avatar         头像 URL（前端拼接展示）
        bio            个人简介（最多 128 字符）
        role           角色：'user'（普通学生）/ 'admin'（平台管理员）
        is_certified   是否完成校园身份认证
        created_at     注册时间
        updated_at     最后修改时间
    """

    # 角色枚举
    ROLE_CHOICES = (
        ('user', '普通用户'),
        ('admin', '管理员'),
    )

    # ----- 校园场景扩展字段 -----
    # 学校名称（学生所在高校，便于按学校筛选 / 推荐）
    school = models.CharField('学校', max_length=64, blank=True, default='')
    # 学号（校园身份认证依据）
    student_id = models.CharField('学号', max_length=32, blank=True, default='')
    # 信用分：0-100 整数，初始 80
    credit_score = models.IntegerField('信用分', default=80)
    # 头像 URL（前端展示）
    avatar = models.URLField('头像URL', max_length=512, blank=True, default='')
    # 个人简介（最多 128 字符）
    bio = models.CharField('个人简介', max_length=128, blank=True, default='')
    # 角色：user / admin
    role = models.CharField('角色', max_length=16, choices=ROLE_CHOICES, default='user')
    # 是否完成校园身份认证
    is_certified = models.BooleanField('是否校园认证', default=False)

    # ----- 时间戳 -----
    # 注册时间（创建后不可变）
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    # 资料最后修改时间（任意字段更新都会刷新）
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        """模型元数据：表名、中文名、复合索引。"""
        # 自定义表名，避免 Django 默认的 auth_user
        db_table = 'market_user'
        # Django Admin 中显示的单数名
        verbose_name = '用户'
        verbose_name_plural = verbose_name
        # 常用过滤组合：按角色 + 启用状态
        indexes = [
            models.Index(fields=['role', 'is_active'], name='idx_mkt_user_role_active'),
        ]

    def __str__(self):
        """调试 / Admin 列表展示用：返回登录名。"""
        return self.username


# ---------------------------------------------------------------------------
# 2) Category — 商品分类（支持一级 + 二级，自引用）
# ---------------------------------------------------------------------------
class Category(models.Model):
    """商品分类（自引用支持二级树形结构）。

    函数功能：
        - 顶级分类（教材 / 数码 / 服饰 / 生活 / 其他）的 ``parent`` 为空；
        - 二级分类（手机 / 电脑 / 配件 …）的 ``parent`` 指向对应的一级分类；
        - 删除父分类时，子分类的 ``parent`` 置空而非级联删除，避免误删。

    字段说明：
        name         分类显示名（如"大学教材"）
        code         唯一代码（用于程序内引用，替代硬编码 id）
        parent       父分类（一级为 NULL）
        icon         图标（SVG 路径或 Lucide 名；不使用 emoji 作为图标）
        sort_order   排序权重，小的靠前
        is_active    是否启用；下架后商品仍可保留在历史数据中
        created_at   创建时间
    """

    # 分类名（前端直接展示）
    name = models.CharField('分类名', max_length=32)
    # 唯一代码（前端/AI 服务硬编码引用此值，如 'textbook_uni'）
    code = models.CharField('代码', max_length=32, unique=True)
    # 自引用父分类；删父分类时置空
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='children',
        verbose_name='父分类',
    )
    # 图标：存 SVG path 或 Lucide 名称（按 spec 严禁 emoji）
    icon = models.CharField('图标', max_length=64, blank=True, default='')
    # 排序权重
    sort_order = models.IntegerField('排序', default=0)
    # 是否启用
    is_active = models.BooleanField('启用', default=True)
    # 创建时间
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        """分类元数据。"""
        db_table = 'market_category'
        verbose_name = '商品分类'
        verbose_name_plural = verbose_name
        # 默认按 sort_order 升序展示
        ordering = ['sort_order', 'id']
        indexes = [
            models.Index(fields=['parent', 'sort_order'], name='idx_mkt_cat_parent_sort'),
        ]

    def __str__(self):
        """调试 / Admin 展示用：分类名。"""
        return self.name


# ---------------------------------------------------------------------------
# 3) Product — 商品
# ---------------------------------------------------------------------------
class Product(models.Model):
    """校园二手商品。

    函数功能：
        - 关联卖家（User）、分类（Category），构成商品核心信息；
        - 状态机驱动商品生命周期：``draft -> pending -> on_sale -> pending_sold -> sold``，
          以及 ``off_shelf`` 旁路；
        - 维护浏览数 / 收藏数 / 审核信息等运营字段。

    字段说明：
        seller           发布者（关联 User）
        category         所属分类（外键，保护分类被删时商品仍可读）
        title            商品标题（最多 64 字）
        description      商品描述（最多 500 字）
        price            售价
        original_price   原价（可空，便于前端展示"打折"标签）
        condition        成色：new / like_new / good / fair
        status           状态机字段（见 STATUS_CHOICES）
        school           商品所在学校（冗余 seller.school，便于按学校过滤）
        view_count       浏览数（详情页进入 +1）
        favorite_count   收藏数（冗余存储，避免每次 COUNT）
        audit_remark     审核备注
        audited_at       审核时间
        created_at       创建时间
        updated_at       最后修改时间
        sold_at          售出时间
    """

    # 商品状态机
    STATUS_CHOICES = (
        ('draft', '草稿'),
        ('pending', '待审核'),
        ('on_sale', '在售'),
        ('pending_sold', '已订未付'),
        ('sold', '已售'),
        ('off_shelf', '已下架'),
    )
    # 商品成色
    CONDITION_CHOICES = (
        ('new', '全新'),
        ('like_new', '9成新'),
        ('good', '8成新'),
        ('fair', '7成新及以下'),
    )

    # ----- 关联关系 -----
    # 卖家：发布者，删除卖家时级联删除其商品
    seller = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='products', verbose_name='卖家',
    )
    # 分类：删除分类时 PROTECT，避免误删
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name='products', verbose_name='分类',
    )

    # ----- 商品信息 -----
    # 标题（前端卡片 / 详情页主标题）
    title = models.CharField('标题', max_length=64)
    # 描述
    description = models.TextField('描述', max_length=500, blank=True, default='')
    # 售价
    price = models.DecimalField('售价', max_digits=10, decimal_places=2)
    # 原价（可空）
    original_price = models.DecimalField(
        '原价', max_digits=10, decimal_places=2, null=True, blank=True,
    )
    # 成色
    condition = models.CharField(
        '成色', max_length=16, choices=CONDITION_CHOICES, default='like_new',
    )
    # 状态
    status = models.CharField(
        '状态', max_length=16, choices=STATUS_CHOICES, default='pending',
    )
    # 商品所在学校（冗余 seller.school）
    school = models.CharField('所在学校', max_length=64, blank=True, default='')

    # ----- 统计字段 -----
    # 浏览数
    view_count = models.IntegerField('浏览数', default=0)
    # 收藏数（冗余）
    favorite_count = models.IntegerField('收藏数', default=0)

    # ----- 审核信息 -----
    # 审核备注（驳回理由）
    audit_remark = models.CharField('审核备注', max_length=128, blank=True, default='')
    # 审核时间
    audited_at = models.DateTimeField('审核时间', null=True, blank=True)

    # ----- 时间戳 -----
    # 创建时间
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    # 更新时间
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    # 售出时间（status=sold 时填入）
    sold_at = models.DateTimeField('售出时间', null=True, blank=True)

    class Meta:
        """商品元数据：表名、默认排序、复合索引。"""
        db_table = 'market_product'
        verbose_name = '商品'
        verbose_name_plural = verbose_name
        # 默认按创建时间倒序
        ordering = ['-created_at']
        # 关键过滤组合的索引
        indexes = [
            # 首页瀑布流：按状态 + 时间倒序
            models.Index(fields=['status', '-created_at'], name='idx_mkt_prod_status_ctime'),
            # 类目页：按分类 + 状态
            models.Index(fields=['category', 'status'], name='idx_mkt_prod_cat_status'),
            # 我的发布：按卖家 + 状态
            models.Index(fields=['seller', 'status'], name='idx_mkt_prod_seller_status'),
        ]

    def __str__(self):
        """调试用：截断标题。"""
        return f'Product#{self.id} {self.title[:20]}'


# ---------------------------------------------------------------------------
# 4) ProductImage — 商品图片
# ---------------------------------------------------------------------------
class ProductImage(models.Model):
    """商品图片（最多 9 张，超出部分由前端在发布时限制）。

    函数功能：
        - 与 Product 一对多关系，删除商品时级联删除图片；
        - ``sort_order`` 控制图片在轮播中的展示顺序（0 为封面）。

    字段说明：
        product      所属商品
        image_url    图片 URL（可托管到 OSS / 七牛 / 本地 MEDIA_ROOT）
        sort_order   排序（升序）
        created_at   创建时间
    """

    # 所属商品
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='images', verbose_name='商品',
    )
    # 图片 URL（外链可访问）
    image_url = models.URLField('图片URL', max_length=512)
    # 排序（升序，0 为封面）
    sort_order = models.IntegerField('排序', default=0)
    # 创建时间
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        """商品图片元数据。"""
        db_table = 'market_product_image'
        verbose_name = '商品图片'
        verbose_name_plural = verbose_name
        # 默认按 sort_order 升序，封面优先
        ordering = ['sort_order']

    def __str__(self):
        """调试用：图片序号 + 所属商品 ID。"""
        return f'ProductImage#{self.id} product={self.product_id}'


# ---------------------------------------------------------------------------
# 5) Favorite — 收藏
# ---------------------------------------------------------------------------
class Favorite(models.Model):
    """用户对商品的收藏关系（多对多中间表）。

    函数功能：
        - 一个用户对同一商品只能收藏一次，重复收藏由 ``unique_together`` 约束；
        - 删除用户或商品时级联删除收藏记录。

    字段说明：
        user        收藏者
        product     被收藏商品
        created_at  收藏时间
    """

    # 收藏者
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='favorites', verbose_name='用户',
    )
    # 被收藏商品
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='favorited_by', verbose_name='商品',
    )
    # 收藏时间
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        """收藏元数据。"""
        db_table = 'market_favorite'
        verbose_name = '收藏'
        verbose_name_plural = verbose_name
        # 同一用户对同一商品唯一
        unique_together = [('user', 'product')]
        # 按时间倒序
        ordering = ['-created_at']

    def __str__(self):
        """调试用：用户 + 商品。"""
        return f'Favorite user={self.user_id} product={self.product_id}'


# ---------------------------------------------------------------------------
# 6) Conversation — 会话（基于商品的私聊）
# ---------------------------------------------------------------------------
class Conversation(models.Model):
    """私聊会话（基于一件商品的"买家 ↔ 卖家"双向会话）。

    函数功能：
        - 同一买家对同一商品只产生一个会话（unique_together 约束）；
        - 记录最后一条消息预览 + 时间戳 + 双方未读数，供会话列表展示；
        - 删除商品时级联删除会话（连带消息一起），避免出现"孤儿会话"。

    字段说明：
        product         关联商品（同一商品同一买家仅一个会话）
        buyer           买家
        seller          卖家
        last_message    最后一条消息预览（截断 200 字内）
        last_message_at 最后消息时间（用于会话列表排序）
        unread_buyer    买家未读消息数
        unread_seller   卖家未读消息数
        created_at      会话创建时间
        updated_at      会话最后更新时间
    """

    # 关联商品
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='conversations', verbose_name='商品',
    )
    # 买家
    buyer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='buyer_conversations', verbose_name='买家',
    )
    # 卖家
    seller = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='seller_conversations', verbose_name='卖家',
    )
    # 最后一条消息预览
    last_message = models.TextField('最后消息', blank=True, default='')
    # 最后消息时间
    last_message_at = models.DateTimeField('最后消息时间', null=True, blank=True)
    # 买家未读消息数
    unread_buyer = models.IntegerField('买家未读数', default=0)
    # 卖家未读消息数
    unread_seller = models.IntegerField('卖家未读数', default=0)
    # 创建时间
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    # 更新时间
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        """会话元数据。"""
        db_table = 'market_conversation'
        verbose_name = '会话'
        verbose_name_plural = verbose_name
        # 同一商品同一买家唯一
        unique_together = [('product', 'buyer')]
        # 按最后消息时间倒序
        ordering = ['-last_message_at', '-created_at']

    def __str__(self):
        """调试用：会话 ID + 买卖双方。"""
        return f'Conversation#{self.id} buyer={self.buyer_id} seller={self.seller_id}'


# ---------------------------------------------------------------------------
# 7) Message — 私聊消息
# ---------------------------------------------------------------------------
class Message(models.Model):
    """私聊消息。

    函数功能：
        - 隶属某个会话，发送方必为会话的 buyer / seller 之一；
        - 标记已读状态，供未读数维护。

    字段说明：
        conversation  所属会话
        sender        发送方
        content       消息内容（最多 1000 字）
        is_read       是否已读
        created_at    发送时间
    """

    # 所属会话
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages', verbose_name='会话',
    )
    # 发送方
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sent_messages', verbose_name='发送方',
    )
    # 消息内容
    content = models.TextField('内容', max_length=1000)
    # 是否已读（接收方已查看）
    is_read = models.BooleanField('已读', default=False)
    # 发送时间
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        """消息元数据。"""
        db_table = 'market_message'
        verbose_name = '消息'
        verbose_name_plural = verbose_name
        # 按时间升序（聊天页时间线）
        ordering = ['created_at']
        indexes = [
            # 会话内时间线
            models.Index(fields=['conversation', 'created_at'], name='idx_mkt_msg_conv_time'),
        ]

    def __str__(self):
        """调试用：消息内容前 20 字。"""
        return f'Message#{self.id} {self.content[:20]}'


# ---------------------------------------------------------------------------
# 8) Order — 订单（状态机）
# ---------------------------------------------------------------------------
class Order(models.Model):
    """订单，状态机为 ``requested -> confirmed -> shipping -> completed``，
    任意阶段可 ``cancelled``。

    函数功能：
        - 关联商品 / 买家 / 卖家，下单时将 ``price`` 快照保存（避免商品改价后影响订单）；
        - 交易方式支持 ``pickup``（校内自取）和 ``express``（快递）；
        - 删除商品 / 买家 / 卖家时 PROTECT，避免误删。

    字段说明：
        product          关联商品（PROTECT）
        buyer            买家（PROTECT）
        seller           卖家（PROTECT）
        status           订单状态
        shipping_method  交易方式
        price            成交价快照
        note             备注
        pickup_location  自取地点
        pickup_time      自取时间
        created_at       下单时间
        updated_at       最后变更时间
        completed_at     完成时间
    """

    # 订单状态机
    STATUS_CHOICES = (
        ('requested', '已申请'),
        ('confirmed', '已确认'),
        ('shipping', '待取/待发'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    )
    # 交易方式
    SHIPPING_CHOICES = (
        ('pickup', '校内自取'),
        ('express', '快递'),
    )

    # ----- 关联 -----
    # 关联商品（SET_NULL：商品删除后保留订单记录，仅清空 product 字段）
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        verbose_name='商品',
    )
    # 买家
    buyer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='buy_orders', verbose_name='买家',
    )
    # 卖家
    seller = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='sell_orders', verbose_name='卖家',
    )

    # ----- 状态 / 交易方式 -----
    # 订单状态
    status = models.CharField(
        '状态', max_length=16, choices=STATUS_CHOICES, default='requested',
    )
    # 交易方式
    shipping_method = models.CharField(
        '交易方式', max_length=16, choices=SHIPPING_CHOICES, default='pickup',
    )
    # 成交价快照（创建订单时拷贝自商品）
    price = models.DecimalField('成交价', max_digits=10, decimal_places=2)
    # 备注
    note = models.CharField('备注', max_length=128, blank=True, default='')
    # 自取地点
    pickup_location = models.CharField('自取地点', max_length=128, blank=True, default='')
    # 自取时间
    pickup_time = models.DateTimeField('自取时间', null=True, blank=True)

    # ----- 时间戳 -----
    # 下单时间
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    # 最后变更时间
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    # 完成时间
    completed_at = models.DateTimeField('完成时间', null=True, blank=True)

    class Meta:
        """订单元数据。"""
        db_table = 'market_order'
        verbose_name = '订单'
        verbose_name_plural = verbose_name
        # 默认按时间倒序
        ordering = ['-created_at']
        indexes = [
            # 我的购买 / 我的销售列表
            models.Index(fields=['buyer', 'status'], name='idx_mkt_ord_buyer_status'),
            models.Index(fields=['seller', 'status'], name='idx_mkt_ord_seller_status'),
        ]

    def __str__(self):
        """调试用：订单 ID + 状态。"""
        return f'Order#{self.id} {self.status}'


# ---------------------------------------------------------------------------
# 9) Review — 评价
# ---------------------------------------------------------------------------
class Review(models.Model):
    """订单完成后买卖双方互评。

    函数功能：
        - 1 个订单 1 条评价（OneToOne），reviewer 与 reviewee 必须不同；
        - 评价影响信用分（评价完成后由业务层 +1 / -1 调整）。

    字段说明：
        order        关联订单（OneToOne）
        reviewer     评价方
        reviewee     被评价方
        rating       星级 1-5
        content      评价内容（最多 300 字）
        created_at   评价时间
    """

    # 关联订单（1 对 1）
    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name='review', verbose_name='订单',
    )
    # 评价方
    reviewer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='reviews_given', verbose_name='评价方',
    )
    # 被评价方
    reviewee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='reviews_received', verbose_name='被评价方',
    )
    # 星级 1-5
    rating = models.IntegerField('星级', choices=[(i, str(i)) for i in range(1, 6)])
    # 评价内容
    content = models.TextField('内容', max_length=300, blank=True, default='')
    # 评价时间
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        """评价元数据。"""
        db_table = 'market_review'
        verbose_name = '评价'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            # 被评价方收到的评价列表
            models.Index(fields=['reviewee', '-created_at'], name='idx_mkt_rv_reviewee'),
        ]

    def __str__(self):
        """调试用。"""
        return f'Review#{self.id} {self.rating}stars'


# ---------------------------------------------------------------------------
# 10) Report — 举报
# ---------------------------------------------------------------------------
class Report(models.Model):
    """用户对商品的举报。

    函数功能：
        - 举报人 + 商品唯一标识一次举报；
        - 状态机：``pending -> warned / removed / banned / rejected``；
        - 管理员处理后写入 ``handler`` / ``handled_at``。

    字段说明：
        reporter      举报人
        product       被举报商品
        reason        举报原因（枚举）
        description   详细说明
        status        处理状态
        handled_at    处理时间
        handler       处理人（管理员）
        created_at    举报时间
    """

    # 举报原因
    REASON_CHOICES = (
        ('fake', '虚假信息'),
        ('prohibited', '违禁物品'),
        ('price', '价格异常'),
        ('harassment', '骚扰'),
        ('other', '其他'),
    )
    # 举报状态
    STATUS_CHOICES = (
        ('pending', '待处理'),
        ('warned', '已警告'),
        ('removed', '已下架'),
        ('banned', '已封禁'),
        ('rejected', '已驳回'),
    )

    # 举报人
    reporter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='reports_made', verbose_name='举报人',
    )
    # 被举报商品
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='reports', verbose_name='被举报商品',
    )
    # 举报原因
    reason = models.CharField('原因', max_length=16, choices=REASON_CHOICES)
    # 详细说明
    description = models.TextField('详细说明', max_length=300, blank=True, default='')
    # 处理状态
    status = models.CharField(
        '状态', max_length=16, choices=STATUS_CHOICES, default='pending',
    )
    # 处理时间
    handled_at = models.DateTimeField('处理时间', null=True, blank=True)
    # 处理人（管理员；SET_NULL 保留历史记录）
    handler = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_handled',
        verbose_name='处理人',
    )
    # 举报时间
    created_at = models.DateTimeField('举报时间', auto_now_add=True)
    # 实际处理动作：warn / remove / ban / reject（管理员写入）
    action = models.CharField(
        '处理动作', max_length=16, blank=True, default='',
        help_text='warn=警告 / remove=下架 / ban=封禁 / reject=驳回',
    )
    # 处理备注（管理员填写）
    remark = models.CharField('处理备注', max_length=128, blank=True, default='')

    class Meta:
        """举报元数据。"""
        db_table = 'market_report'
        verbose_name = '举报'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            # 管理员后台：按状态过滤
            models.Index(fields=['status', '-created_at'], name='idx_mkt_rp_status_ctime'),
        ]

    def __str__(self):
        """调试用。"""
        return f'Report#{self.id} {self.reason} -> product={self.product_id}'


# ---------------------------------------------------------------------------
# 11) AuditLog — 管理员操作日志
# ---------------------------------------------------------------------------
class AuditLog(models.Model):
    """管理员关键操作的不可变日志，供事后审计 / 复盘。

    函数功能：
        - 记录"谁 / 在什么时间 / 对什么资源 / 做了什么 / 备注"；
        - 操作为枚举值（通过 / 驳回 / 下架 / 处理举报 / 封禁 / 调分）。

    字段说明：
        operator     操作人（管理员，SET_NULL 保留历史）
        action       操作类型（枚举）
        target_type  目标资源类型（如 'product' / 'user' / 'report'）
        target_id    目标资源 ID
        remark       备注
        created_at   操作时间
    """

    # 操作枚举
    ACTION_CHOICES = (
        ('approve_product', '通过商品'),
        ('reject_product', '驳回商品'),
        ('off_shelf_product', '下架商品'),
        ('handle_report', '处理举报'),
        ('ban_user', '封禁用户'),
        ('unban_user', '解封用户'),
        ('adjust_credit', '调整信用分'),
        ('update_ai_config', '更新 AI 配置'),
        ('create_category', '新建分类'),
        ('update_category', '更新分类'),
        ('delete_category', '删除分类'),
    )

    # 操作人
    operator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        verbose_name='操作人',
    )
    # 操作类型
    action = models.CharField('操作', max_length=32, choices=ACTION_CHOICES)
    # 目标资源类型（字符串，方便后期扩展）
    target_type = models.CharField('目标类型', max_length=32)
    # 目标资源 ID（可空，如批量操作）
    target_id = models.IntegerField('目标ID', null=True, blank=True)
    # 备注
    remark = models.CharField('备注', max_length=128, blank=True, default='')
    # 操作时间
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        """审计日志元数据。"""
        db_table = 'market_audit_log'
        verbose_name = '审计日志'
        verbose_name_plural = verbose_name
        # 按时间倒序
        ordering = ['-created_at']
        indexes = [
            # 管理员操作历史
            models.Index(fields=['operator', '-created_at'], name='idx_mkt_aud_operator'),
        ]

    def __str__(self):
        """调试用。"""
        return f'AuditLog#{self.id} {self.action}'


class SystemSetting(models.Model):
    """系统级配置（KV 存储）。

    字段说明：
        key          配置键（唯一）
        value        配置值（统一存字符串）
        description  描述
        updated_at   更新时间
    """

    key = models.CharField('配置键', max_length=64, unique=True)
    value = models.TextField('配置值', blank=True, default='')
    description = models.CharField('描述', max_length=255, blank=True, default='')
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        """系统配置元数据。"""
        db_table = 'market_system_setting'
        verbose_name = '系统配置'
        verbose_name_plural = verbose_name

    def __str__(self):
        """调试用。"""
        return f'Setting#{self.key}={self.value[:32]}'
