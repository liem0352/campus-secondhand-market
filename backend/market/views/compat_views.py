"""
market.views.compat_views
==========================

为前端 / 第三方调用提供的兼容性与扩展接口：

- :class:`UserPublicView`           GET   /api/users/<int:pk>/       指定用户公开资料
- :class:`ProductSuggestView`       GET   /api/products/suggest/     搜索建议（前缀匹配）
- :class:`ProductUploadImageView`   POST  /api/products/upload-image/  商品图片上传
- :class:`ProductReviewsView`       GET   /api/products/<int:pk>/reviews/  商品评价列表
- :class:`ProductSimilarView`       GET   /api/products/<int:pk>/similar/  同分类相似商品
- :class:`BulkOffShelfView`         POST  /api/products/bulk-off-shelf/  卖家批量下架
- :class:`RefreshTokenView`         POST  /api/auth/refresh/         刷新 JWT
- :class:`MeOverviewView`           GET   /api/stats/me/overview/    个人中心汇总
- :class:`LegacyFavoriteToggleView` POST  /api/favorites/toggle/     兼容旧前端：按 body.product_id 切换

模块目标：保持单一职责，不与已有视图耦合；新增字段对前端透明。
"""
from django.db.models import Avg, Count, Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from market.exceptions import ValidationException
from market.models import Favorite, Order, Product, Review
from market.pagination import EnvelopePageNumberPagination
from market.response import ok
from market.serializers.product_serializers import ProductBriefSerializer
from market.serializers.user_serializers import UserSerializer
from market.serializers.order_serializers import ReviewSerializer
from market.views.upload_views import ImageUploadView


# ---------------------------------------------------------------------------
# 公开用户资料
# ---------------------------------------------------------------------------
class UserPublicView(APIView):
    """指定 id 用户的公开资料。"""

    permission_classes = [AllowAny]

    def get(self, request, pk):
        """返回用户公开字段（不含手机号 / 邮箱等敏感信息）。"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'code': 40401, 'message': '用户不存在', 'data': None}, status=404,
            )
        return ok(UserSerializer(user).data)


# ---------------------------------------------------------------------------
# 搜索建议
# ---------------------------------------------------------------------------
class ProductSuggestView(APIView):
    """GET /api/products/suggest/?q=xxx

    返回最多 10 条与关键词相关的商品标题与分类，
    用于首页 / 搜索页的下拉建议。前缀匹配优先，无前缀则模糊匹配。
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """根据 ``q`` 返回建议列表。"""
        q = (request.query_params.get('q') or '').strip()
        if not q:
            return ok({'keyword': '', 'items': []})

        # 1) 商品标题前缀匹配
        products = list(
            Product.objects.filter(status='on_sale')
            .filter(Q(title__icontains=q))
            .order_by('-view_count', '-created_at')
            .values('id', 'title', 'price')[:8]
        )
        # 2) 分类匹配
        from market.models import Category
        cats = list(
            Category.objects.filter(is_active=True, name__icontains=q)
            .order_by('sort_order', 'id')
            .values('id', 'name')[:4]
        )
        items = []
        for p in products:
            items.append({
                'type': 'product',
                'id': p['id'],
                'text': p['title'],
                'extra': '¥' + str(p['price']),
            })
        for c in cats:
            items.append({
                'type': 'category',
                'id': c['id'],
                'text': c['name'],
                'extra': '分类',
            })
        return ok({'keyword': q, 'items': items[:10]})


# ---------------------------------------------------------------------------
# 商品图片上传（复用通用 ImageUploadView）
# ---------------------------------------------------------------------------
class ProductUploadImageView(ImageUploadView):
    """POST /api/products/upload-image/

    完全复用通用 ``ImageUploadView`` 逻辑，仅用于兼容旧前端。
    """

    pass


# ---------------------------------------------------------------------------
# 商品评价列表
# ---------------------------------------------------------------------------
class ProductReviewsView(APIView):
    """GET /api/products/<id>/reviews/

    返回该商品的所有评价及评分统计（average / count）。
    """

    permission_classes = [AllowAny]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request, pk):
        """分页返回商品评价。"""
        try:
            product = Product.objects.only('id').get(pk=pk)
        except Product.DoesNotExist:
            return Response(
                {'code': 40401, 'message': '商品不存在', 'data': None}, status=404,
            )

        qs = (
            Review.objects.filter(order__product=product)
            .select_related('reviewer', 'order')
            .order_by('-created_at')
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = ReviewSerializer(page, many=True, context={'request': request})
        page_resp = paginator.get_paginated_response(ser.data)

        # 评分统计
        stats = qs.aggregate(avg=Avg('rating'), count=Count('id'))
        data = dict(page_resp.data.get('data') or {})
        data['average'] = float(stats['avg'] or 0)
        data['count'] = int(stats['count'] or 0)
        page_resp.data['data'] = data
        return page_resp


# ---------------------------------------------------------------------------
# 同分类相似推荐
# ---------------------------------------------------------------------------
class ProductSimilarView(APIView):
    """GET /api/products/<id>/similar/

    返回同分类下的其他在售商品（排除自己），最多 6 条。
    """

    permission_classes = [AllowAny]

    def get(self, request, pk):
        """返回相似商品列表。"""
        try:
            product = Product.objects.select_related('category').get(pk=pk)
        except Product.DoesNotExist:
            return Response(
                {'code': 40401, 'message': '商品不存在', 'data': None}, status=404,
            )

        qs = (
            Product.objects.filter(category_id=product.category_id, status='on_sale')
            .exclude(pk=product.pk)
            .select_related('seller', 'category')
            .prefetch_related('images')
            .order_by('-view_count', '-created_at')[:6]
        )
        ser = ProductBriefSerializer(qs, many=True, context={'request': request})
        return ok(ser.data)


# ---------------------------------------------------------------------------
# 批量下架
# ---------------------------------------------------------------------------
class BulkOffShelfView(APIView):
    """POST /api/products/bulk-off-shelf/

    卖家批量下架自己名下的商品。入参 ``{ids: [1,2,3]}``。
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """将传入 id 列表中属于当前用户的商品下架。"""
        ids = request.data.get('ids') or []
        if not isinstance(ids, list) or not ids:
            raise ValidationException('ids 必须是非空数组')

        qs = Product.objects.filter(pk__in=ids, seller=request.user)
        affected = qs.update(status='off_shelf')
        return ok({'affected': affected})


# ---------------------------------------------------------------------------
# 刷新 Token
# ---------------------------------------------------------------------------
class RefreshTokenView(APIView):
    """POST /api/auth/refresh/  {refresh: 'xxx'} -> {access, refresh}"""

    permission_classes = [AllowAny]

    def post(self, request):
        """校验 refresh token 并签发新的 access（旋转 refresh）。"""
        token = (request.data or {}).get('refresh')
        if not token:
            return Response(
                {'code': 40001, 'message': '缺少 refresh token', 'data': None}, status=400,
            )
        try:
            rt = RefreshToken(token)
            return ok({'access': str(rt.access_token), 'refresh': str(rt)})
        except TokenError as e:
            return Response(
                {'code': 40102, 'message': f'refresh 无效：{e}', 'data': None}, status=401,
            )


# ---------------------------------------------------------------------------
# 个人中心汇总（个人视角）
# ---------------------------------------------------------------------------
class MeOverviewView(APIView):
    """GET /api/stats/me/overview/

    返回个人维度的统计数据：发布数 / 已售 / 收藏 / 评价 / 信用分 等。
    与 ``/users/me/stats/`` 字段保持一致，便于前端兼容。
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """聚合统计当前用户的核心数据。"""
        user = request.user
        return ok({
            'on_sale': Product.objects.filter(seller=user, status='on_sale').count(),
            'sold': Product.objects.filter(seller=user, status='sold').count(),
            'favorites': Favorite.objects.filter(user=user).count(),
            'reviews': Review.objects.filter(reviewee=user).count(),
            'orders_as_buyer': Order.objects.filter(buyer=user).count(),
            'orders_as_seller': Order.objects.filter(seller=user).count(),
            'credit_score': user.credit_score,
            'username': user.username,
        })


# ---------------------------------------------------------------------------
# 兼容旧前端：POST /api/favorites/toggle/
# ---------------------------------------------------------------------------
class LegacyFavoriteToggleView(APIView):
    """POST /api/favorites/toggle/  {product_id: 1}

    兼容旧前端（小程序旧版 / 第三方）。内部行为与
    ``/api/products/<id>/favorite/`` 完全一致。
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """切换收藏状态。"""
        product_id = (request.data or {}).get('product_id')
        if not product_id:
            raise ValidationException('缺少 product_id')
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response(
                {'code': 40401, 'message': '商品不存在', 'data': None}, status=404,
            )

        from django.db.models import F
        favorite, created = Favorite.objects.get_or_create(user=request.user, product=product)
        if not created:
            favorite.delete()
            Product.objects.filter(pk=product.pk).update(
                favorite_count=F('favorite_count') - 1,
            )
            product.refresh_from_db(fields=['favorite_count'])
            return ok({
                'favorited': False,
                'favorite_count': max(0, product.favorite_count),
            })
        Product.objects.filter(pk=product.pk).update(
            favorite_count=F('favorite_count') + 1,
        )
        product.refresh_from_db(fields=['favorite_count'])
        return ok({
            'favorited': True,
            'favorite_count': product.favorite_count,
        })
