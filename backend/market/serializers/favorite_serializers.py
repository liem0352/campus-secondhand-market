"""
market.serializers.favorite_serializers
======================================

收藏（Favorite）相关序列化器。
- :class:`FavoriteSerializer` 收藏关联（带商品简要 + 是否收藏标志）
"""
from rest_framework import serializers

from market.models import Favorite

from .product_serializers import ProductBriefSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    """收藏记录序列化器。

    序列化时将"被收藏的商品"用 :class:`ProductBriefSerializer` 展开，
    便于前端直接渲染"我的收藏"列表。
    """

    product_detail = ProductBriefSerializer(source='product', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'product', 'product_detail', 'created_at']
        read_only_fields = ['id', 'created_at']
