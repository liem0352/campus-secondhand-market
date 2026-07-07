"""
market.serializers.category_serializers
=======================================

商品分类序列化器。
- :class:`CategorySerializer` 支持一级 / 二级树形嵌套输出。
"""
from rest_framework import serializers

from market.models import Category


class CategorySerializer(serializers.ModelSerializer):
    """商品分类序列化器。

    字段说明：
        id          主键
        name        分类名
        code        唯一代码
        parent      父分类 ID（可空）
        icon        图标（SVG path 或 Lucide 名）
        sort_order  排序权重
        children    子分类列表（仅一级分类返回，避免无限递归）
    """

    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'code', 'parent', 'icon', 'sort_order', 'is_active', 'children']

    def get_children(self, obj: Category):
        """仅当 obj 是父分类时，递归序列化其激活的子分类。"""
        if obj.parent is None:
            qs = obj.children.filter(is_active=True).order_by('sort_order', 'id')
            return CategorySerializer(qs, many=True, context=self.context).data
        return []
