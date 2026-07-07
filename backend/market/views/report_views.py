"""
market.views.report_views
==========================

举报相关视图（前台 + 管理后台共用）。
- :class:`ReportCreateView`  POST /api/reports/        用户提交举报
- :class:`ReportListView`    GET  /api/admin/reports/  管理员查看举报列表
"""
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from market.exceptions import ValidationException
from market.models import Product, Report
from market.pagination import EnvelopePageNumberPagination
from market.permissions import IsAdminUser
from market.response import created, ok
from market.serializers.report_serializers import (
    ReportCreateSerializer,
    ReportSerializer,
)


class ReportCreateView(APIView):
    """用户提交举报 — ``POST /api/reports/``"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """创建一条举报（默认 status=pending）。"""
        ser = ReportCreateSerializer(data=request.data)
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        data = ser.validated_data
        product = get_object_or_404(Product, pk=data['product_id'])
        if product.seller_id == request.user.id:
            return Response(
                {'code': 40001, 'message': '不能举报自己的商品', 'data': None}, status=400,
            )
        report = Report.objects.create(
            reporter=request.user,
            product=product,
            reason=data['reason'],
            description=data.get('description', ''),
        )
        return created(ReportSerializer(report).data, '已提交举报')


class ReportListView(APIView):
    """管理员查看举报列表 — ``GET /api/admin/reports/``

    支持按 ``status`` 过滤：
    - ``pending``  — status='pending'（待处理）
    - ``handled``  — status ∈ ('warned', 'removed', 'banned')（已处理）
    - ``dismissed``— status='rejected'（已驳回）
    - ``all``      — 不加过滤
    """

    permission_classes = [IsAdminUser]
    pagination_class = EnvelopePageNumberPagination

    # 状态字符串 -> 后端 ORM 过滤映射
    STATUS_FILTER_MAP = {
        'pending':   ['pending'],
        'handled':   ['warned', 'removed', 'banned'],
        'dismissed': ['rejected'],
    }

    def get(self, request):
        """支持按 status 过滤 + 关键词搜索（举报人 / 商品标题 / 描述）。"""
        qs = Report.objects.select_related('reporter', 'handler', 'product')\
            .order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            backend_statuses = self.STATUS_FILTER_MAP.get(status_filter)
            if backend_statuses is not None:
                qs = qs.filter(status__in=backend_statuses)
            else:
                # 兜底：按原始字符串精确匹配
                qs = qs.filter(status=status_filter)
        # 关键词搜索：举报人 / 商品标题 / 描述
        keyword = (request.query_params.get('keyword') or '').strip()
        if keyword:
            qs = qs.filter(
                Q(reporter__username__icontains=keyword)
                | Q(product__title__icontains=keyword)
                | Q(description__icontains=keyword)
            )
        # 举报原因（中文标签）模糊匹配
        reason = (request.query_params.get('reason') or '').strip()
        if reason:
            qs = qs.filter(reason__icontains=reason)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = ReportSerializer(page, many=True)
        return paginator.get_paginated_response(ser.data)


class ReportCountView(APIView):
    """返回举报各状态聚合数量 — ``GET /api/admin/reports/count/``

    返回 ``{pending, handled, dismissed, all}`` 四项计数。
    - pending: status='pending'
    - handled: status in ('warned', 'removed', 'banned') —— 即对卖家/商品产生了实际处理动作
    - dismissed: status='rejected' —— 驳回举报，无处理动作
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        """聚合各状态举报数量。"""
        pending = Report.objects.filter(status='pending').count()
        handled = Report.objects.filter(status__in=['warned', 'removed', 'banned']).count()
        dismissed = Report.objects.filter(status='rejected').count()
        return ok({
            'pending': pending,
            'handled': handled,
            'dismissed': dismissed,
            'all': Report.objects.count(),
        })
