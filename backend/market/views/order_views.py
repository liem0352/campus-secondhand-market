"""
market.views.order_views
=========================

订单 / 评价 视图。
- :class:`OrderListCreateView`     GET/POST /api/orders/
- :class:`OrderDetailView`         GET      /api/orders/{id}/
- :class:`ConfirmOrderView`        POST     /api/orders/{id}/confirm/
- :class:`RejectOrderView`         POST     /api/orders/{id}/reject/
- :class:`CancelOrderView`         POST     /api/orders/{id}/cancel/
- :class:`CompleteOrderView`       POST     /api/orders/{id}/complete/
- :class:`ShipOrderView`           POST     /api/orders/{id}/ship/
- :class:`ReviewCreateView`        POST     /api/reviews/
"""
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from market.exceptions import (
    PermissionDeniedException,
    ResourceNotFoundException,
    ValidationException,
)
from market.models import Order, Product, Review
from market.pagination import EnvelopePageNumberPagination
from market.response import created, ok
from market.serializers.order_serializers import (
    OrderCreateSerializer,
    OrderSerializer,
    ReviewCreateSerializer,
    ReviewSerializer,
)


# ---------------------------------------------------------------------------
# 工具
# ---------------------------------------------------------------------------
def _get_order(user, pk):
    """取订单 + 校验当前用户是 buyer / seller 之一。"""
    order = get_object_or_404(
        Order.objects.select_related('product', 'buyer', 'seller')
            .prefetch_related('product__images'),
        pk=pk,
    )
    if user.id not in (order.buyer_id, order.seller_id) and user.role != 'admin':
        raise PermissionDeniedException('无权访问该订单')
    return order


# ---------------------------------------------------------------------------
# 订单列表 + 创建
# ---------------------------------------------------------------------------
class OrderListCreateView(APIView):
    """订单列表 + 创建。

    GET  /api/orders/?status=&role=
    POST /api/orders/   body: ``{product_id, shipping_method?, note?, pickup_location?, pickup_time?}``
    """

    permission_classes = [IsAuthenticated]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request):
        """过滤当前用户相关订单，支持 status / role。"""
        user = request.user
        role = request.query_params.get('role')
        qs = Order.objects.select_related('product', 'buyer', 'seller')\
            .prefetch_related('product__images')

        if role == 'buyer':
            qs = qs.filter(buyer=user)
        elif role == 'seller':
            qs = qs.filter(seller=user)
        else:
            qs = qs.filter(Q(buyer=user) | Q(seller=user))

        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter)

        qs = qs.order_by('-created_at')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = OrderSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(ser.data)

    def post(self, request):
        """创建订单（买家点击"我想要"）。"""
        ser = OrderCreateSerializer(data=request.data)
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        data = ser.validated_data
        product = get_object_or_404(Product, pk=data['product_id'])
        if product.seller_id == request.user.id:
            raise PermissionDeniedException('不能购买自己的商品')
        if product.status == 'sold':
            raise ValidationException('该商品已售出')
        if product.status in ('off_shelf',):
            raise ValidationException('该商品已下架')

        order = Order.objects.create(
            product=product,
            buyer=request.user,
            seller=product.seller,
            price=product.price,
            shipping_method=data.get('shipping_method', 'pickup'),
            note=data.get('note', ''),
            pickup_location=data.get('pickup_location', ''),
            pickup_time=data.get('pickup_time'),
        )
        # 商品进入 pending_sold 状态
        if product.status == 'on_sale':
            product.status = 'pending_sold'
            product.save(update_fields=['status', 'updated_at'])
        return created(OrderSerializer(order, context={'request': request}).data, '已下单')


# ---------------------------------------------------------------------------
# 订单详情
# ---------------------------------------------------------------------------
class OrderDetailView(APIView):
    """订单详情。"""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """返回订单详情。"""
        order = _get_order(request.user, pk)
        return ok(OrderSerializer(order, context={'request': request}).data)


# ---------------------------------------------------------------------------
# 状态机 action
# ---------------------------------------------------------------------------
class ConfirmOrderView(APIView):
    """卖家确认订单 requested -> confirmed。"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """校验角色 + 状态后切换到 confirmed，可附带 shipping_method。"""
        order = _get_order(request.user, pk)
        if order.seller_id != request.user.id:
            raise PermissionDeniedException('仅卖家可确认')
        if order.status != 'requested':
            raise ValidationException(f'当前状态 {order.status} 不允许确认')
        shipping = request.data.get('shipping_method') or order.shipping_method
        if shipping in ('pickup', 'express'):
            order.shipping_method = shipping
        order.status = 'confirmed'
        order.save(update_fields=['status', 'shipping_method', 'updated_at'])
        return ok(OrderSerializer(order, context={'request': request}).data, '已确认')


class RejectOrderView(APIView):
    """卖家拒绝订单 requested -> cancelled。"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """校验角色 + 状态后切换到 cancelled。"""
        order = _get_order(request.user, pk)
        if order.seller_id != request.user.id:
            raise PermissionDeniedException('仅卖家可拒绝')
        if order.status != 'requested':
            raise ValidationException(f'当前状态 {order.status} 不允许拒绝')
        order.status = 'cancelled'
        order.save(update_fields=['status', 'updated_at'])
        # 释放商品
        if order.product.status == 'pending_sold':
            order.product.status = 'on_sale'
            order.product.save(update_fields=['status', 'updated_at'])
        return ok(OrderSerializer(order, context={'request': request}).data, '已拒绝')


class CancelOrderView(APIView):
    """买家取消订单 requested -> cancelled。"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """买家在卖家确认前可取消。"""
        order = _get_order(request.user, pk)
        if order.buyer_id != request.user.id:
            raise PermissionDeniedException('仅买家可取消')
        if order.status != 'requested':
            raise ValidationException(f'当前状态 {order.status} 不允许取消')
        order.status = 'cancelled'
        order.save(update_fields=['status', 'updated_at'])
        if order.product.status == 'pending_sold':
            order.product.status = 'on_sale'
            order.product.save(update_fields=['status', 'updated_at'])
        return ok(OrderSerializer(order, context={'request': request}).data, '已取消')


class ShipOrderView(APIView):
    """卖家标记发货 confirmed -> shipping。"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """卖家发货（快递场景）；自取时由双方自行约定。"""
        order = _get_order(request.user, pk)
        if order.seller_id != request.user.id:
            raise PermissionDeniedException('仅卖家可标记发货')
        if order.status != 'confirmed':
            raise ValidationException(f'当前状态 {order.status} 不允许发货')
        order.status = 'shipping'
        order.save(update_fields=['status', 'updated_at'])
        return ok(OrderSerializer(order, context={'request': request}).data, '已发货')


class CompleteOrderView(APIView):
    """标记订单完成 confirmed/shipping -> completed。"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """买家确认收货（confirmed / shipping -> completed），同时商品置为 sold。"""
        order = _get_order(request.user, pk)
        if order.status not in ('confirmed', 'shipping'):
            raise ValidationException(f'当前状态 {order.status} 不允许完成')
        order.status = 'completed'
        order.completed_at = timezone.now()
        order.save(update_fields=['status', 'completed_at', 'updated_at'])
        # 商品置 sold
        product = order.product
        product.status = 'sold'
        product.sold_at = timezone.now()
        product.save(update_fields=['status', 'sold_at', 'updated_at'])
        return ok(OrderSerializer(order, context={'request': request}).data, '已完成')


# ---------------------------------------------------------------------------
# 评价
# ---------------------------------------------------------------------------
class ReviewCreateView(APIView):
    """提交评价（仅 completed 订单可评）。"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """写入 Review；同一订单只能评一次。"""
        ser = ReviewCreateSerializer(data=request.data)
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        data = ser.validated_data
        order = get_object_or_404(Order, pk=data['order_id'])
        if request.user.id not in (order.buyer_id, order.seller_id):
            raise PermissionDeniedException('无权评价该订单')
        if order.status != 'completed':
            raise ValidationException('订单未完成，不能评价')
        if hasattr(order, 'review') and order.review is not None:
            raise ValidationException('该订单已评价')

        reviewee_id = order.seller_id if request.user.id == order.buyer_id else order.buyer_id
        review = Review.objects.create(
            order=order,
            reviewer=request.user,
            reviewee_id=reviewee_id,
            rating=data['rating'],
            content=data.get('content', ''),
        )
        return created(ReviewSerializer(review).data, '已评价')
