"""
market.views.product_views
===========================

商品 / 收藏相关视图。
- :class:`ProductListCreateView`   GET/POST  /api/products/         商品列表/创建
- :class:`ProductDetailView`       GET/PUT/DEL /api/products/{id}/  商品详情/更新/删除
- :class:`MyProductsView`          GET       /api/products/mine/   我的商品（按状态分组）
- :class:`ProductViewView`         POST      /api/products/{id}/view/   浏览 +1
- :class:`FavoriteToggleView`      POST      /api/products/{id}/favorite/  收藏切换
- :class:`MyFavoritesView`         GET       /api/favorites/        我的收藏
- :class:`OffShelfView`            POST      /api/products/{id}/off-shelf/  下架
- :class:`OnShelfView`             POST      /api/products/{id}/on-shelf/   上架
"""
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from market.exceptions import PermissionDeniedException, ResourceNotFoundException, ValidationException
from market.models import Favorite, Product
from market.pagination import EnvelopePageNumberPagination
from market.permissions import IsAdminUser
from market.response import created, ok
from market.serializers.favorite_serializers import FavoriteSerializer
from market.serializers.product_serializers import (
    ProductBriefSerializer,
    ProductCreateSerializer,
    ProductDetailSerializer,
    ProductUpdateSerializer,
)


# ---------------------------------------------------------------------------
# 商品列表 + 创建
# ---------------------------------------------------------------------------
class ProductListCreateView(APIView):
    """商品列表 + 发布。

    GET  /api/products/
        支持过滤：
            - ``status``      商品状态（on_sale / sold / pending / off_shelf / draft）
            - ``category``    分类 ID
            - ``school``      学校（模糊）
            - ``condition``   成色
            - ``keyword``     标题模糊关键词
            - ``seller_id``   指定卖家
            - ``min_price`` / ``max_price``
    POST /api/products/
        发布商品（自动设置 seller = request.user）。
    """

    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request):
        """分页 + 过滤返回商品列表。"""
        qs = Product.objects.select_related('seller', 'category').prefetch_related('images')

        # 默认仅展示 on_sale / sold（如未指定 status）
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        else:
            qs = qs.filter(status__in=['on_sale', 'sold'])

        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)

        school = request.query_params.get('school')
        if school:
            qs = qs.filter(school__icontains=school)

        condition = request.query_params.get('condition')
        if condition:
            qs = qs.filter(condition=condition)

        keyword = request.query_params.get('keyword')
        if keyword:
            qs = qs.filter(Q(title__icontains=keyword) | Q(description__icontains=keyword))

        seller_id = request.query_params.get('seller_id')
        if seller_id:
            qs = qs.filter(seller_id=seller_id)

        min_price = request.query_params.get('min_price')
        if min_price:
            try:
                qs = qs.filter(price__gte=float(min_price))
            except ValueError:
                pass
        max_price = request.query_params.get('max_price')
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except ValueError:
                pass

        qs = qs.order_by('-created_at')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = ProductBriefSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(ser.data)

    def post(self, request):
        """发布商品。"""
        ser = ProductCreateSerializer(data=request.data, context={'request': request})
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        product = ser.save()
        return created(
            ProductDetailSerializer(product, context={'request': request}).data,
            message='发布成功',
        )


# ---------------------------------------------------------------------------
# 商品详情 / 更新 / 删除
# ---------------------------------------------------------------------------
class ProductDetailView(APIView):
    """商品详情 / 更新 / 删除。"""

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_object(self, pk):
        """根据主键取商品，附带 select_related 优化。"""
        return get_object_or_404(
            Product.objects.select_related('seller', 'category').prefetch_related('images'),
            pk=pk,
        )

    def get(self, request, pk):
        """返回商品详情。"""
        product = self.get_object(pk)
        return ok(ProductDetailSerializer(product, context={'request': request}).data)

    def put(self, request, pk):
        """更新商品（仅卖家本人或管理员）。"""
        product = self.get_object(pk)
        if product.seller_id != request.user.id and not (request.user.role == 'admin'):
            raise PermissionDeniedException('无权修改该商品')
        ser = ProductUpdateSerializer(product, data=request.data, partial=True)
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        ser.save()
        return ok(ProductDetailSerializer(product, context={'request': request}).data)

    def patch(self, request, pk):
        """同 PUT，兼容前端 PATCH 风格。"""
        return self.put(request, pk)

    def delete(self, request, pk):
        """删除商品（仅卖家本人或管理员）。

        业务规则：
            1. 仅允许删除"未成交"（无订单 或 所有订单均已取消）的商品；
            2. 存在未完成订单时返回 400 提示用户先处理订单；
            3. 强制删除（force=true）会先把相关订单 product 置空并标记 cancelled。
        """
        product = self.get_object(pk)
        if product.seller_id != request.user.id and not (request.user.role == 'admin'):
            raise PermissionDeniedException('无权删除该商品')

        # 检查是否存在未完成订单（requested/confirmed/shipping 视为未完成）
        from market.models import Order
        active_order_states = ('requested', 'confirmed', 'shipping')
        active_orders = Order.objects.filter(product=product, status__in=active_order_states)
        if active_orders.exists() and request.query_params.get('force') != 'true':
            raise ValidationException(
                f'该商品还有 {active_orders.count()} 笔未完成订单，请先处理订单后再删除',
                data={'active_order_count': active_orders.count()},
            )

        # 强制删除：把活跃订单的 product 置空并标记 cancelled
        if request.query_params.get('force') == 'true':
            active_orders.update(product=None, status='cancelled')

        product.delete()
        return ok(None, '已删除')


# ---------------------------------------------------------------------------
# 我的商品
# ---------------------------------------------------------------------------
class MyProductsView(APIView):
    """当前登录用户的商品列表（按状态分组）。"""

    permission_classes = [IsAuthenticated]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request):
        """支持 ``status`` / ``category`` / ``keyword`` 过滤。"""
        qs = Product.objects.filter(seller=request.user)\
            .select_related('category').prefetch_related('images')

        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter)
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)
        keyword = request.query_params.get('keyword')
        if keyword:
            qs = qs.filter(Q(title__icontains=keyword) | Q(description__icontains=keyword))

        qs = qs.order_by('-created_at')

        # 按状态分组（同时返回 count + results）
        groups = {
            'on_sale': qs.filter(status='on_sale'),
            'pending': qs.filter(status='pending'),
            'sold': qs.filter(status='sold'),
            'off_shelf': qs.filter(status='off_shelf'),
        }
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = ProductBriefSerializer(page, many=True, context={'request': request})
        page_resp = paginator.get_paginated_response(ser.data)
        # 在 data 中追加分组计数
        data = dict(page_resp.data.get('data') or {})
        data['groups'] = {k: v.count() for k, v in groups.items()}
        page_resp.data['data'] = data
        return page_resp


# ---------------------------------------------------------------------------
# 浏览数 +1
# ---------------------------------------------------------------------------
class ProductViewView(APIView):
    """商品浏览 +1（无需鉴权，失败静默）。"""

    permission_classes = []

    def post(self, request, pk):
        """原子 +1 浏览数；商品不存在返回 200 + {count: 0}。"""
        try:
            product = Product.objects.only('id', 'view_count').get(pk=pk)
            Product.objects.filter(pk=pk).update(view_count=F('view_count') + 1)
            return ok({'view_count': product.view_count + 1})
        except Product.DoesNotExist:
            return ok({'view_count': 0})


# ---------------------------------------------------------------------------
# 收藏切换
# ---------------------------------------------------------------------------
class FavoriteToggleView(APIView):
    """切换商品收藏状态。"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """已收藏则取消；未收藏则创建。"""
        product = get_object_or_404(Product, pk=pk)
        favorite, created = Favorite.objects.get_or_create(user=request.user, product=product)
        if not created:
            favorite.delete()
            Product.objects.filter(pk=pk).update(
                favorite_count=F('favorite_count') - 1,
            )
            product.refresh_from_db(fields=['favorite_count'])
            return ok({'favorited': False, 'favorite_count': max(0, product.favorite_count)})
        Product.objects.filter(pk=pk).update(
            favorite_count=F('favorite_count') + 1,
        )
        product.refresh_from_db(fields=['favorite_count'])
        return ok({'favorited': True, 'favorite_count': product.favorite_count})


# ---------------------------------------------------------------------------
# 我的收藏
# ---------------------------------------------------------------------------
class MyFavoritesView(APIView):
    """当前用户收藏列表。"""

    permission_classes = [IsAuthenticated]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request):
        """分页返回当前用户收藏（含商品简要）。"""
        qs = Favorite.objects.filter(user=request.user)\
            .select_related('product', 'product__category', 'product__seller')\
            .prefetch_related('product__images')\
            .order_by('-created_at')
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = FavoriteSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(ser.data)


# ---------------------------------------------------------------------------
# 上架 / 下架
# ---------------------------------------------------------------------------
class OffShelfView(APIView):
    """下架商品（卖家或管理员）。"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """将商品状态置为 off_shelf。"""
        product = get_object_or_404(Product, pk=pk)
        if product.seller_id != request.user.id and request.user.role != 'admin':
            raise PermissionDeniedException('无权下架该商品')
        product.status = 'off_shelf'
        product.save(update_fields=['status', 'updated_at'])
        return ok({'status': product.status, 'status_display': product.get_status_display()}, '已下架')


class OnShelfView(APIView):
    """重新上架商品（仅 pending / off_shelf 可上架）。"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """将商品状态置为 on_sale。"""
        product = get_object_or_404(Product, pk=pk)
        if product.seller_id != request.user.id and request.user.role != 'admin':
            raise PermissionDeniedException('无权上架该商品')
        if product.status not in ('off_shelf', 'pending'):
            return Response(
                {'code': 40001, 'message': f'当前状态 {product.status} 不允许上架', 'data': None},
                status=400,
            )
        product.status = 'on_sale'
        product.save(update_fields=['status', 'updated_at'])
        return ok({'status': product.status, 'status_display': product.get_status_display()}, '已上架')
