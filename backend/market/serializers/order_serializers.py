"""
market.serializers.order_serializers
====================================

订单 / 评价 序列化器。
- :class:`OrderSerializer`        订单完整信息
- :class:`OrderCreateSerializer`  订单创建入参
- :class:`ReviewSerializer`       评价
- :class:`ReviewCreateSerializer` 评价入参
"""
from rest_framework import serializers

from market.models import Order, Review

from .user_serializers import UserBriefSerializer


class OrderSerializer(serializers.ModelSerializer):
    """订单完整序列化器。

    字段说明：
        product_brief  商品简要（带 cover）
        buyer          买家简要
        seller         卖家简要
        status_display 状态中文
        shipping_display 交易方式中文
    """

    product_brief = serializers.SerializerMethodField()
    buyer = UserBriefSerializer(read_only=True)
    seller = UserBriefSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    shipping_display = serializers.CharField(source='get_shipping_method_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'product', 'product_brief', 'buyer', 'seller',
            'status', 'status_display',
            'shipping_method', 'shipping_display',
            'price', 'note', 'pickup_location', 'pickup_time',
            'created_at', 'updated_at', 'completed_at',
        ]
        read_only_fields = fields  # 状态变更走专门的 action

    def get_product_brief(self, obj: Order) -> dict:
        """返回订单商品的简要信息（ID + 标题 + 封面 + 价格）。"""
        if not obj.product_id:
            return {}
        product = obj.product
        first_image = product.images.first() if hasattr(product, 'images') else None
        return {
            'id': product.id,
            'title': product.title,
            'cover': first_image.image_url if first_image else '',
            'price': str(product.price),
        }


class OrderCreateSerializer(serializers.Serializer):
    """创建订单入参。"""

    product_id = serializers.IntegerField()
    shipping_method = serializers.ChoiceField(choices=Order.SHIPPING_CHOICES, default='pickup')
    note = serializers.CharField(max_length=128, required=False, allow_blank=True, default='')
    pickup_location = serializers.CharField(max_length=128, required=False, allow_blank=True, default='')
    pickup_time = serializers.DateTimeField(required=False, allow_null=True, default=None)


class ReviewSerializer(serializers.ModelSerializer):
    """评价序列化器。"""

    reviewer = UserBriefSerializer(read_only=True)
    reviewee = UserBriefSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'order', 'reviewer', 'reviewee', 'rating', 'content', 'created_at']
        read_only_fields = ['id', 'reviewer', 'reviewee', 'created_at']


class ReviewCreateSerializer(serializers.Serializer):
    """评价创建入参。"""

    order_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    content = serializers.CharField(max_length=300, required=False, allow_blank=True, default='')
