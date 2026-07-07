"""
market.views.stats_views
=========================

卖家统计聚合接口 —— 校园易物。

提供：
  - :class:`SellerOverviewView`           GET /api/stats/seller/overview/
  - :class:`SellerTrendView`              GET /api/stats/seller/trend/?days=7
  - :class:`SellerCategoryDistributionView` GET /api/stats/seller/category-distribution/

仅限已登录的"卖家"（任意普通用户）调用，统计该用户作为卖家的全部商品/订单数据。
"""
from datetime import timedelta

from django.db.models import Count, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import permissions
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from market.models import Category, Order, Product
from market.response import ok


class _SellerRequiredMixin:
    """要求 request.user 已登录（任何非匿名用户均可作为卖家）。

    管理员审计时可以通过 ?username=xxx 切换统计对象（仅 staff 生效）。
    """

    permission_classes = [permissions.IsAuthenticated]

    def _target_user(self):
        """根据请求参数决定统计谁。

        - 普通用户：只能查自己
        - staff 管理员：可通过 ?username=xxx 查任意用户
        """
        request = self.request
        target_username = request.query_params.get('username')
        if target_username and request.user.is_staff:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                return User.objects.get(username=target_username)
            except User.DoesNotExist:
                raise ValidationError('目标用户不存在')
        return request.user


class SellerOverviewView(_SellerRequiredMixin, APIView):
    """GET /api/stats/seller/overview/

    返回该卖家在售 / 已售 / 待处理订单数 + 当前信用分。
    """

    def get(self, request, *args, **kwargs):
        user = self._target_user()

        # 1) 在售数：on_sale 状态的商品
        on_sale = Product.objects.filter(seller=user, status='on_sale').count()

        # 2) 已售数：sold 状态的商品
        sold = Product.objects.filter(seller=user, status='sold').count()

        # 3) 待处理订单数：requested / confirmed / shipping 状态
        pending_orders = Order.objects.filter(
            seller=user,
            status__in=['requested', 'confirmed', 'shipping'],
        ).count()

        # 4) 信用分：取 user.credit_score，缺省 80
        credit = getattr(user, 'credit_score', 80) or 80

        return ok({
            'on_sale_count': on_sale,
            'sold_count': sold,
            'pending_order_count': pending_orders,
            'credit_score': credit,
            'username': user.username,
        })


class SellerTrendView(_SellerRequiredMixin, APIView):
    """GET /api/stats/seller/trend/?days=7

    返回该卖家最近 N 天每日成交订单数与销售额（仅 status='completed' 的订单）。
    """

    def get(self, request, *args, **kwargs):
        try:
            days = int(request.query_params.get('days', 7))
        except (TypeError, ValueError):
            days = 7
        days = max(1, min(days, 90))  # 1-90 天

        user = self._target_user()
        since = timezone.now() - timedelta(days=days)

        qs = Order.objects.filter(
            seller=user,
            status='completed',
            completed_at__gte=since,
        )

        rows = (
            qs.annotate(day=TruncDate('completed_at'))
              .values('day')
              .annotate(
                  count=Count('id'),
                  amount=Sum('price'),
              )
              .order_by('day')
        )

        # 补齐缺失日期（保证 0 也返回）
        existing = {r['day']: r for r in rows}
        trend = []
        for i in range(days):
            day = (timezone.now() - timedelta(days=days - 1 - i)).date()
            r = existing.get(day)
            trend.append({
                'date': day.strftime('%Y-%m-%d'),
                'count': int(r['count']) if r else 0,
                'amount': float(r['amount'] or 0) if r else 0.0,
            })

        return ok({
            'days': days,
            'trend': trend,
        })


class SellerCategoryDistributionView(_SellerRequiredMixin, APIView):
    """GET /api/stats/seller/category-distribution/

    返回该卖家发布商品在每个分类（一级分类）下的数量与占比。
    """

    def get(self, request, *args, **kwargs):
        user = self._target_user()

        # 关联到 Category（多对一）；统计每类商品数
        qs = (
            Product.objects
            .filter(seller=user)
            .values(name=F('category__name'))
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        rows = [r for r in qs if r['name']]  # 过滤掉 category 为空的孤儿

        total = sum(r['count'] for r in rows) or 1
        distribution = [
            {
                'name': r['name'],
                'count': r['count'],
                'percent': round(r['count'] / total * 100, 1),
            }
            for r in rows
        ]

        return ok({
            'total': total,
            'distribution': distribution,
        })


# 价格区间桶（与前端 ECharts 柱图一致）
PRICE_BUCKETS = [
    (0, 10,    '0-10元'),
    (10, 50,   '10-50元'),
    (50, 100,  '50-100元'),
    (100, 200, '100-200元'),
    (200, 500, '200-500元'),
    (500, None, '500元以上'),
]


class SellerPriceRangeView(_SellerRequiredMixin, APIView):
    """GET /api/stats/seller/price-range/

    返回该卖家在售商品的价格区间分布（按固定 6 个价格段统计）。
    """

    def get(self, request, *args, **kwargs):
        user = self._target_user()
        products = Product.objects.filter(seller=user, status='on_sale').values_list('price', flat=True)

        buckets = []
        for lo, hi, label in PRICE_BUCKETS:
            q = {'price__gte': lo}
            if hi is not None:
                q['price__lt'] = hi
            count = products.filter(**q).count()
            buckets.append({'label': label, 'count': count})

        return ok({'buckets': buckets})
