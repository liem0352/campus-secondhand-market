# -*- coding: utf-8 -*-
"""
市场系统级 API（轮播图 / 公告 / 热门搜索 / 站点统计）。

不修改数据库结构，使用静态配置 + 现有 Model 计算。
所有 endpoint 都不需要鉴权。
"""
import logging
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from market.models import Product, User, Order, Category
from market.response import ok as api_ok

logger = logging.getLogger(__name__)


# 静态：首页轮播 Banner 资源（图片 + 跳转类型 + 跳转参数）
_STATIC_BANNERS = [
    {
        'id': 1,
        'title': '校园易物 · 新生季',
        'subtitle': '学长学姐的闲置好物，等你淘',
        'image': '/assets/banners/banner-welcome.svg',
        'color_from': '#FF6B35',
        'color_to': '#FF8A5B',
        'action_type': 'category',
        'action_payload': 'all',
        'sort': 1,
    },
    {
        'id': 2,
        'title': 'AI 一键发布',
        'subtitle': '拍照即得标题、描述、建议价',
        'image': '/assets/banners/banner-ai.svg',
        'color_from': '#7C3AED',
        'color_to': '#A78BFA',
        'action_type': 'page',
        'action_payload': '/pages/publish/publish',
        'sort': 2,
    },
    {
        'id': 3,
        'title': '信用分 +5 计划',
        'subtitle': '按时发货、积极沟通就能涨',
        'image': '/assets/banners/banner-credit.svg',
        'color_from': '#10B981',
        'color_to': '#34D399',
        'action_type': 'page',
        'action_payload': '/pages/mine/mine',
        'sort': 3,
    },
    {
        'id': 4,
        'title': '1 元起拍 · 周末专场',
        'subtitle': '每周六 20:00 准时开拍',
        'image': '/assets/banners/banner-auction.svg',
        'color_from': '#F59E0B',
        'color_to': '#FCD34D',
        'action_type': 'category',
        'action_payload': 'auction',
        'sort': 4,
    },
]


_STATIC_NOTICES = [
    {
        'id': 1,
        'title': '欢迎使用校园易物 v1.0',
        'body': '本平台为校园同学提供闲置交易、议价、评价等闭环服务。',
        'type': 'info',
        'created_at': '2026-06-01',
    },
    {
        'id': 2,
        'title': '信用分机制上线',
        'body': '信用分 ≥ 80 的同学可获得"优先展示"和"保证金减免"权益。',
        'type': 'success',
        'created_at': '2026-06-03',
    },
    {
        'id': 3,
        'title': '举报处理公示',
        'body': '近 7 日共处理违规商品 12 件，封禁账号 2 个。',
        'type': 'warning',
        'created_at': '2026-06-05',
    },
]


_HOT_KEYWORDS = [
    'iPhone 13', '考研资料', '蓝牙耳机', '自行车',
    '台灯', '教材', '机械键盘', '电风扇', '保温杯',
]


@api_view(['GET'])
@permission_classes([AllowAny])
def banners(request):
    """首页轮播图：返回 4 个静态 banner（按 sort 升序）。"""
    data = sorted(_STATIC_BANNERS, key=lambda b: b.get('sort', 0))
    return api_ok(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def notices(request):
    """系统公告：按时间倒序返回最近 N 条。"""
    limit = int(request.GET.get('limit', 10))
    data = sorted(_STATIC_NOTICES, key=lambda n: n.get('created_at', ''), reverse=True)[:limit]
    return api_ok(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def hot_keywords(request):
    """热门搜索词。"""
    return api_ok(_HOT_KEYWORDS)


@api_view(['GET'])
@permission_classes([AllowAny])
def site_stats(request):
    """站点统计：商品数、用户数、订单数、好评率。"""
    product_count = Product.objects.filter(status='on_sale').count()
    user_count = User.objects.filter(role='user', is_active=True).count()
    order_count = Order.objects.count()
    completed_count = Order.objects.filter(status='completed').count()
    # 评价数：统计 Review 表中已写入评价的订单数（rating 字段位于 Review 模型）
    from market.models import Review
    review_count = Review.objects.count()
    completion_rate = (completed_count / order_count * 100) if order_count else 0

    # 统计最近 7 天新增商品
    from django.utils import timezone
    seven_days_ago = timezone.now() - timezone.timedelta(days=7)
    new_products = Product.objects.filter(created_at__gte=seven_days_ago).count()
    new_users = User.objects.filter(date_joined__gte=seven_days_ago).count()
    new_orders = Order.objects.filter(created_at__gte=seven_days_ago).count()

    data = {
        'product_count': product_count,
        'user_count': user_count,
        'order_count': order_count,
        'completed_count': completed_count,
        'completion_rate': round(completion_rate, 1),
        'review_count': review_count,
        'new_products_7d': new_products,
        'new_users_7d': new_users,
        'new_orders_7d': new_orders,
    }
    return api_ok(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def home_feed(request):
    """首页一站式聚合数据：banner + notice + 分类 + 热门商品 + 推荐商品。

    减少客户端多次请求，缩短首屏时间。
    """
    # 1. 轮播
    banners_data = sorted(_STATIC_BANNERS, key=lambda b: b.get('sort', 0))
    # 2. 公告（最近 3 条）
    notices_data = sorted(_STATIC_NOTICES, key=lambda n: n.get('created_at', ''), reverse=True)[:3]
    # 3. 分类
    cats = list(
        Category.objects.filter(is_active=True).order_by('sort_order', 'id').values(
            'id', 'name', 'icon', 'sort_order'
        )
    )
    # 4. 热门商品（按浏览量 + 收藏数综合）
    hot_qs = Product.objects.filter(status='on_sale').order_by('-view_count', '-favorite_count')[:8]
    hot_products = []
    for p in hot_qs:
        cover = ''
        first_img = p.images.order_by('sort_order', 'id').first()
        if first_img:
            cover = first_img.image_url
        hot_products.append({
            'id': p.id,
            'title': p.title,
            'price': str(p.price),
            'cover': cover,
            'view_count': p.view_count,
            'favorite_count': p.favorite_count,
            'category_name': p.category.name if p.category_id else '',
        })
    # 5. 推荐（最新上架 8 个）
    fresh_qs = Product.objects.filter(status='on_sale').order_by('-created_at')[:8]
    fresh_products = []
    for p in fresh_qs:
        cover = ''
        first_img = p.images.order_by('sort_order', 'id').first()
        if first_img:
            cover = first_img.image_url
        fresh_products.append({
            'id': p.id,
            'title': p.title,
            'price': str(p.price),
            'cover': cover,
            'view_count': p.view_count,
            'favorite_count': p.favorite_count,
            'category_name': p.category.name if p.category_id else '',
        })
    # 6. 站点统计
    product_count = Product.objects.filter(status='on_sale').count()
    user_count = User.objects.filter(role='user', is_active=True).count()
    order_count = Order.objects.filter(status='completed').count()

    data = {
        'banners': banners_data,
        'notices': notices_data,
        'categories': cats,
        'hot_products': hot_products,
        'fresh_products': fresh_products,
        'site_stats': {
            'product_count': product_count,
            'user_count': user_count,
            'order_count': order_count,
        },
    }
    return api_ok(data)
