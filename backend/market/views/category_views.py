"""
market.views.category_views
============================

商品分类视图。
- :class:`CategoryListView`  GET /api/categories/   分类树（一级 + 二级嵌套）
- :class:`CategoryTreeView`  GET /api/categories/tree/  同上，语义化路径
"""
from rest_framework.views import APIView

from market.models import Category
from market.permissions import IsAuthenticatedReadOnly
from market.response import ok
from market.serializers.category_serializers import CategorySerializer


class CategoryListView(APIView):
    """商品分类列表 / 树形结构。

    GET /api/categories/?level=1
        - 不带 ``level`` 参数：返回完整树（仅一级 + 其 children）。
        - ``level=1``：仅返回一级分类（无 children 字段填充）。
        - ``level=2``：返回二级分类扁平列表。
    """

    permission_classes = [IsAuthenticatedReadOnly]

    def get(self, request):
        """返回分类数据。"""
        level = request.query_params.get('level')
        if level == '1':
            qs = Category.objects.filter(parent__isnull=True, is_active=True)\
                .order_by('sort_order', 'id')
            return ok(CategorySerializer(qs, many=True, context={'request': request}).data)
        if level == '2':
            qs = Category.objects.filter(parent__isnull=False, is_active=True)\
                .order_by('parent_id', 'sort_order', 'id')
            return ok(CategorySerializer(qs, many=True, context={'request': request}).data)
        # 默认返回一级树
        qs = Category.objects.filter(parent__isnull=True, is_active=True)\
            .order_by('sort_order', 'id')
        return ok(CategorySerializer(qs, many=True, context={'request': request}).data)


class CategoryTreeView(APIView):
    """GET /api/categories/tree/

    返回完整一级分类 + 二级子分类树（供前端 Cascader / 树形选择器使用）。
    """

    permission_classes = [IsAuthenticatedReadOnly]

    def get(self, request):
        """构造并返回树。"""
        qs = Category.objects.filter(parent__isnull=True, is_active=True)\
            .order_by('sort_order', 'id')
        return ok(CategorySerializer(qs, many=True, context={'request': request}).data)
