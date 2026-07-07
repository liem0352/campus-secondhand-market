"""
market.views.admin_views
=========================

管理后台视图。
- :class:`AdminDashboardView`         GET    /api/admin/dashboard/
- :class:`AdminDashboardTrendView`    GET    /api/admin/dashboard/trend/
- :class:`AdminDashboardCategoryDistView` GET /api/admin/dashboard/category-distribution/
- :class:`AdminAiConfigView`          GET/PUT /api/admin/ai/config/
- :class:`AdminAiHealthView`          POST   /api/admin/ai/health/
- :class:`UserListManageView`        GET    /api/admin/users/
- :class:`UserBanView`                POST   /api/admin/users/{id}/ban/
- :class:`UserUnbanView`              POST   /api/admin/users/{id}/unban/
- :class:`UserAdjustCreditView`       POST   /api/admin/users/{id}/adjust-credit/
- :class:`ProductAuditListView`       GET    /api/admin/products/audit/
- :class:`ProductApproveView`         POST   /api/admin/products/{id}/approve/
- :class:`ProductRejectView`          POST   /api/admin/products/{id}/reject/
- :class:`CategoryManageView`         GET/POST/PUT/DELETE /api/admin/categories/
- :class:`ReportListView`             GET    /api/admin/reports/
- :class:`ReportHandleView`           POST   /api/admin/reports/{id}/handle/
- :class:`AuditLogListView`           GET    /api/admin/audit-logs/
"""
from datetime import timedelta

from django.db.models import Count, F, Sum
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, IsAdminUser as DRFIsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from market.exceptions import (
    PermissionDeniedException,
    ValidationException,
)
from market.models import (
    AuditLog,
    Category,
    Conversation,
    Message,
    Order,
    Product,
    ProductImage,
    Report,
    User,
)
from market.pagination import EnvelopePageNumberPagination
from market.permissions import IsAdminUser
from market.response import created, ok
from market.serializers.audit_serializers import AuditLogSerializer
from market.serializers.category_serializers import CategorySerializer
from market.serializers.product_serializers import ProductBriefSerializer
from market.serializers.report_serializers import ReportSerializer
from market.serializers.user_serializers import UserSerializer


def _log(operator, action, target_type, target_id=None, remark=''):
    """写一条审计日志的便捷方法。"""
    return AuditLog.objects.create(
        operator=operator,
        action=action,
        target_type=target_type,
        target_id=target_id,
        remark=remark[:128] if remark else '',
    )


# ---------------------------------------------------------------------------
# 仪表盘
# ---------------------------------------------------------------------------
class AdminDashboardView(APIView):
    """管理仪表盘 — 关键指标聚合。"""

    permission_classes = [IsAdminUser]

    def get(self, request):
        """返回总览数据。"""
        today = timezone.now().date()
        return ok({
            'user_count': User.objects.filter(is_active=True).count(),
            'product_count': Product.objects.count(),
            'on_sale_count': Product.objects.filter(status='on_sale').count(),
            'pending_count': Product.objects.filter(status='pending').count(),
            'sold_count': Product.objects.filter(status='sold').count(),
            'order_count': Order.objects.count(),
            'completed_order_count': Order.objects.filter(status='completed').count(),
            'today_order_count': Order.objects.filter(created_at__date=today).count(),
            'today_product_count': Product.objects.filter(created_at__date=today).count(),
            'today_user_count': User.objects.filter(created_at__date=today).count(),
            'message_count': Message.objects.count(),
            'conversation_count': Conversation.objects.count(),
            'pending_report_count': Report.objects.filter(status='pending').count(),
            'pending_audit_count': Product.objects.filter(status='pending').count(),
            'total_amount': float(Order.objects.filter(status='completed').aggregate(s=Sum('price'))['s'] or 0),
            'category_distribution': list(
                Category.objects.annotate(c=Count('products')).values('id', 'name', 'c').order_by('-c')[:10]
            ),
        })


class AdminDashboardTrendView(APIView):
    """GET /api/admin/dashboard/trend/?days=30

    返回最近 N 天新增用户、活跃用户、商品发布数。
    兼容前端 ECharts 折线图：``[{date, new_count, active_count, product_count}, ...]``。
    当无记录时自动补齐日期，数据为 0。
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        """返回最近 N 天（默认 30）每日数据。"""
        try:
            days = int(request.query_params.get('days', 30))
        except (TypeError, ValueError):
            days = 30
        days = max(1, min(days, 90))

        since = timezone.now() - timedelta(days=days)

        # 新增用户
        user_rows = (
            User.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(new_count=Count('id'))
        )
        # 新增商品
        product_rows = (
            Product.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(product_count=Count('id'))
        )
        # 订单 = 视为"活跃行为"
        order_rows = (
            Order.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(active_count=Count('id'))
        )

        user_map = {r['day']: int(r['new_count']) for r in user_rows}
        product_map = {r['day']: int(r['product_count']) for r in product_rows}
        active_map = {r['day']: int(r['active_count']) for r in order_rows}

        trend = []
        for i in range(days):
            day = (timezone.now() - timedelta(days=days - 1 - i)).date()
            trend.append({
                'date': day.strftime('%Y-%m-%d'),
                'new_count': user_map.get(day, 0),
                'active_count': active_map.get(day, 0),
                'product_count': product_map.get(day, 0),
            })

        return ok({'days': days, 'trend': trend})


class AdminDashboardCategoryDistView(APIView):
    """GET /api/admin/dashboard/category-distribution/

    返回全平台商品按一级分类的分布（每类含 id / name / value / percent）。
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        """统计各分类商品数 + 占比。"""
        qs = (
            Product.objects
            .values(cat_id=F('category__id'), name=F('category__name'))
            .annotate(value=Count('id'))
            .order_by('-value')
        )
        rows = [r for r in qs if r['name']]
        total = sum(r['value'] for r in rows) or 1
        distribution = [
            {
                'id': r['cat_id'],
                'name': r['name'],
                'value': int(r['value']),
                'percent': round(int(r['value']) / total * 100, 1),
            }
            for r in rows
        ]
        return ok({'total': total, 'distribution': distribution})


# ---------------------------------------------------------------------------
# AI 配置 & 健康检查
# ---------------------------------------------------------------------------
class AdminAiConfigView(APIView):
    """GET / PUT /api/admin/ai/config/

    AI 配置的读取与更新。配置存于数据库（首次访问时自动 seed）。
    返回脱敏后的 key（仅后 4 位）。
    """

    permission_classes = [IsAdminUser]

    def _get_settings(self):
        """懒加载 :class:`market.models.SystemSetting` 并 seed 默认值。"""
        from market.models import SystemSetting
        defaults = [
            ('ai_enabled', 'true', 'AI 总开关'),
            ('ai_api_key', '', 'AI 提供方 API Key'),
            ('ai_model', 'gpt-4o-mini', '默认模型'),
            ('ai_base_url', 'https://api.openai.com/v1', 'API Base URL'),
            ('ai_timeout', '30', '调用超时（秒）'),
        ]
        for k, v, desc in defaults:
            SystemSetting.objects.get_or_create(
                key=k, defaults={'value': v, 'description': desc},
            )
        qs = SystemSetting.objects.filter(key__in=[d[0] for d in defaults])
        return {s.key: s.value for s in qs}

    def _mask(self, key):
        """脱敏 API Key：仅显示后 4 位。"""
        if not key:
            return ''
        if len(key) <= 4:
            return '*' * len(key)
        return '*' * (len(key) - 4) + key[-4:]

    def get(self, request):
        """返回 AI 配置。"""
        s = self._get_settings()
        masked = self._mask(s.get('ai_api_key') or '')
        return ok({
            'enabled': str(s.get('ai_enabled', 'true')).lower() in ('1', 'true', 'yes'),
            'api_key': masked,
            'api_key_set': bool(s.get('ai_api_key')),
            'model': s.get('ai_model') or 'gpt-4o-mini',
            'base_url': s.get('ai_base_url') or '',
            'timeout': int(s.get('ai_timeout') or 30),
        })

    def put(self, request):
        """更新 AI 配置（只更新提供的字段）。"""
        from market.models import SystemSetting
        s = self._get_settings()
        if 'enabled' in request.data:
            v = 'true' if request.data.get('enabled') in (True, 'true', 1, '1') else 'false'
            SystemSetting.objects.filter(key='ai_enabled').update(value=v)
        if 'api_key' in request.data:
            new_key = (request.data.get('api_key') or '').strip()
            if new_key and not new_key.startswith('*'):
                SystemSetting.objects.filter(key='ai_api_key').update(value=new_key)
        for k in ('model', 'base_url'):
            if k in request.data:
                SystemSetting.objects.filter(key=f'ai_{k}').update(
                    value=str(request.data.get(k) or '').strip(),
                )
        if 'timeout' in request.data:
            try:
                t = int(request.data.get('timeout') or 30)
            except (TypeError, ValueError):
                t = 30
            SystemSetting.objects.filter(key='ai_timeout').update(value=str(max(1, min(120, t))))

        _log(request.user, 'update_ai_config', 'system', None, '管理员更新 AI 配置')
        # 返回更新后的配置
        return self.get(request)


class AdminAiHealthView(APIView):
    """GET/POST /api/admin/ai/health/

    测试 AI 连接是否正常。返回 ``{ok, latency_ms, message}``。
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        """GET 仅返回 AI 服务的元信息（无需真实调用）。"""
        try:
            from market.services.ai_service import get_ai_service
            ai = get_ai_service()
            meta = ai.describe() if hasattr(ai, 'describe') else {'provider': 'mock', 'has_key': False}
        except Exception as exc:  # noqa: BLE001
            return ok({'ok': False, 'message': str(exc), 'meta': {}}, message='AI 服务不可用')
        return ok({'ok': True, 'message': 'AI 服务可用', 'meta': meta})

    def post(self, request):
        """POST 真实探测 AI 服务的连通性与延迟。"""
        start = timezone.now()
        try:
            from market.services.ai_service import get_ai_service
            ai = get_ai_service()
            health = ai.health_check() if hasattr(ai, 'health_check') else {'ok': True, 'message': 'AI 服务已就绪'}
        except Exception as exc:
            health = {'ok': False, 'message': f'AI 服务异常: {exc}'}
        latency_ms = int((timezone.now() - start).total_seconds() * 1000)
        return ok({**health, 'latency_ms': latency_ms})


# ---------------------------------------------------------------------------
# 用户管理
# ---------------------------------------------------------------------------
class UserListManageView(APIView):
    """管理员查看 / 搜索用户。"""

    permission_classes = [IsAdminUser]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request):
        """支持 ``keyword`` / ``role`` / ``is_active`` 过滤。"""
        qs = User.objects.all().order_by('-created_at')
        keyword = request.query_params.get('keyword')
        if keyword:
            qs = qs.filter(username__icontains=keyword)
        role = request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        is_active = request.query_params.get('is_active')
        if is_active in ('0', 'false'):
            qs = qs.filter(is_active=False)
        elif is_active in ('1', 'true'):
            qs = qs.filter(is_active=True)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = UserSerializer(page, many=True)
        return paginator.get_paginated_response(ser.data)


class UserBanView(APIView):
    """封禁（禁用）用户。"""

    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        """is_active=False；可附带 ``ban_reason`` 备注。"""
        user = get_object_or_404(User, pk=pk)
        if user.role == 'admin':
            return Response(
                {'code': 40001, 'message': '不能封禁管理员', 'data': None}, status=400,
            )
        user.is_active = False
        user.save(update_fields=['is_active', 'updated_at'])
        _log(request.user, 'ban_user', 'user', pk, request.data.get('ban_reason', ''))
        return ok({'is_active': False}, '已封禁')


class UserUnbanView(APIView):
    """解封（重新激活）用户。"""

    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        """is_active=True。"""
        user = get_object_or_404(User, pk=pk)
        if user.role == 'admin':
            return Response(
                {'code': 40001, 'message': '不能操作管理员', 'data': None}, status=400,
            )
        user.is_active = True
        user.save(update_fields=['is_active', 'updated_at'])
        _log(request.user, 'unban_user', 'user', pk, '')
        return ok({'is_active': True}, '已解封')


class UserAdjustCreditView(APIView):
    """调整用户信用分。"""

    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        """``delta`` 正负整数；越界 [0, 100] 自动夹紧。"""
        user = get_object_or_404(User, pk=pk)
        try:
            delta = int(request.data.get('delta', 0))
        except (TypeError, ValueError):
            raise ValidationException('delta 必须为整数')
        before = user.credit_score
        user.credit_score = max(0, min(100, before + delta))
        user.save(update_fields=['credit_score', 'updated_at'])
        _log(request.user, 'adjust_credit', 'user', pk,
             f'before={before} delta={delta} after={user.credit_score}')
        return ok({'credit_score': user.credit_score})


# ---------------------------------------------------------------------------
# 商品审核
# ---------------------------------------------------------------------------
class ProductAuditListView(APIView):
    """待审核商品列表。"""

    permission_classes = [IsAdminUser]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request):
        """支持按 status 过滤；默认仅返回 pending。"""
        qs = Product.objects.select_related('seller', 'category')\
            .prefetch_related('images').order_by('-created_at')
        status_filter = request.query_params.get('status', 'pending')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = ProductBriefSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(ser.data)


class ProductApproveView(APIView):
    """通过商品审核。"""

    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        """pending -> on_sale。"""
        product = get_object_or_404(Product, pk=pk)
        if product.status not in ('pending', 'pending_sold'):
            raise ValidationException(f'当前状态 {product.status} 不允许通过')
        product.status = 'on_sale'
        product.audited_at = timezone.now()
        product.audit_remark = ''
        product.save(update_fields=['status', 'audited_at', 'audit_remark', 'updated_at'])
        _log(request.user, 'approve_product', 'product', pk, request.data.get('remark', ''))
        return ok({'status': product.status}, '已通过')


class ProductRejectView(APIView):
    """驳回商品审核。"""

    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        """pending -> off_shelf；audit_remark 写驳回理由。"""
        product = get_object_or_404(Product, pk=pk)
        if product.status not in ('pending',):
            raise ValidationException(f'当前状态 {product.status} 不允许驳回')
        remark = (request.data.get('remark') or '').strip()[:128]
        if not remark:
            raise ValidationException('请填写驳回理由')
        product.status = 'off_shelf'
        product.audited_at = timezone.now()
        product.audit_remark = remark
        product.save(update_fields=['status', 'audited_at', 'audit_remark', 'updated_at'])
        _log(request.user, 'reject_product', 'product', pk, remark)
        return ok({'status': product.status}, '已驳回')


# ---------------------------------------------------------------------------
# 分类管理
# ---------------------------------------------------------------------------
class CategoryManageView(APIView):
    """管理员维护分类（GET/POST/PUT/PATCH/DELETE）。

    - GET    /api/admin/categories/             列表
    - POST   /api/admin/categories/             新增
    - PUT    /api/admin/categories/             批量更新（请求体为 list）
    - PATCH  /api/admin/categories/{id}/        单个更新（请求体为 object）
    - DELETE /api/admin/categories/?id={id}     单个删除（query 传 id）
    - DELETE /api/admin/categories/{id}/        单个删除（兼容 URL 传 id）
    """

    permission_classes = [IsAdminUser]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request):
        """返回全部分类（树形/扁平由 frontend 决定）。"""
        qs = Category.objects.all().order_by('sort_order', 'id')
        return ok(CategorySerializer(qs, many=True).data)

    def post(self, request):
        """新增分类。"""
        ser = CategorySerializer(data=request.data)
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        cat = ser.save()
        _log(request.user, 'create_category', 'category', cat.id, cat.name)
        return created(CategorySerializer(cat).data, '已创建')

    def put(self, request):
        """批量更新：请求体为 ``[ {id, name?, parent?, sort_order?, icon?, is_active?}, ... ]``。"""
        data = request.data
        if not isinstance(data, list):
            # 兼容：单个对象时退化为 patch 语义
            return self._patch_one(None, data)
        updated = 0
        for item in data:
            cat_id = item.get('id')
            if not cat_id:
                continue
            try:
                cat = Category.objects.get(pk=cat_id)
            except Category.DoesNotExist:
                continue
            ser = CategorySerializer(cat, data=item, partial=True)
            if ser.is_valid():
                ser.save()
                updated += 1
                _log(request.user, 'update_category', 'category', cat.id, cat.name)
        return ok({'updated': updated}, '已更新')

    def patch(self, request, pk=None):
        """PATCH /api/admin/categories/{id}/ 单个更新。"""
        if pk is None:
            # PATCH /api/admin/categories/ 兼容写法
            cat_id = request.data.get('id') if isinstance(request.data, dict) else None
            if not cat_id:
                raise ValidationException('缺少 id')
            pk = cat_id
        return self._patch_one(pk, request.data)

    def _patch_one(self, pk, payload):
        """单个分类更新工具方法。"""
        if pk is None:
            raise ValidationException('缺少分类 id')
        cat = get_object_or_404(Category, pk=pk)
        ser = CategorySerializer(cat, data=payload, partial=True)
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        ser.save()
        _log(request.user, 'update_category', 'category', cat.id, cat.name)
        return ok(CategorySerializer(cat).data, '已更新')

    def delete(self, request, pk=None):
        """删除分类。

        - 优先使用 URL 中的 ``pk``（DELETE /api/admin/categories/{id}/）；
        - 兼容旧前端从 query string 取 ``id``（DELETE /api/admin/categories/?id=...）。
        """
        cat_id = pk if pk is not None else request.query_params.get('id')
        if not cat_id:
            raise ValidationException('缺少 id 参数')
        cat = get_object_or_404(Category, pk=cat_id)
        if cat.products.exists():
            return Response(
                {'code': 40001, 'message': '该分类下还有商品，不能删除', 'data': None},
                status=400,
            )
        name = cat.name
        cat_id_saved = cat.id
        cat.delete()
        _log(request.user, 'delete_category', 'category', cat_id_saved, name)
        return ok(None, '已删除')


# ---------------------------------------------------------------------------
# 举报处理
# ---------------------------------------------------------------------------
class ReportHandleView(APIView):
    """管理员处理举报。

    ``action`` ∈ {warn, remove, ban, reject}。
    处理后会同时把 ``action`` 与 ``remark`` 写回 ``Report`` 表，
    便于详情页直接展示（不依赖审计日志倒推）。
    """

    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        """按 action 执行对应处理（warning / 下架 / 封禁 / 驳回），记录操作人与备注。"""
        report = get_object_or_404(Report, pk=pk)
        if report.status != 'pending':
            raise ValidationException('该举报已处理')
        action = request.data.get('action')
        remark = (request.data.get('remark') or '').strip()[:128]
        if action == 'warn':
            report.status = 'warned'
        elif action == 'remove':
            report.status = 'removed'
            # 下架商品
            if report.product:
                report.product.status = 'off_shelf'
                report.product.save(update_fields=['status', 'updated_at'])
        elif action == 'ban':
            report.status = 'banned'
            if report.product and report.product.seller:
                seller = report.product.seller
                seller.is_active = False
                seller.save(update_fields=['is_active', 'updated_at'])
        elif action == 'reject':
            report.status = 'rejected'
        else:
            raise ValidationException('action 必须为 warn/remove/ban/reject')
        report.handler = request.user
        report.handled_at = timezone.now()
        # 记录 action + remark（用于详情页展示）
        report.action = action
        report.remark = remark
        report.save(update_fields=[
            'status', 'handler', 'handled_at', 'action', 'remark',
        ])
        _log(request.user, 'handle_report', 'report', pk, f'action={action} {remark}')
        return ok(ReportSerializer(report).data, '已处理')


# ---------------------------------------------------------------------------
# 计数接口（用于管理后台 Tabs 徽标）
# ---------------------------------------------------------------------------
class ProductAuditCountView(APIView):
    """返回商品审核各状态的数量 — ``GET /api/admin/products/audit/count/``

    返回 ``{pending, approved, rejected, all}`` 四项计数。
    前端 useList + Tabs 徽标使用：badge = count。
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        """聚合各状态商品数量。"""
        pending = Product.objects.filter(status='pending').count()
        # 已通过：pending -> on_sale；on_sale 即为"已通过在售"
        approved = Product.objects.filter(status='on_sale').count()
        # 已驳回：被管理员驳回到 off_shelf + 附带 audit_remark 的记录
        rejected = Product.objects.filter(status='off_shelf').exclude(audit_remark='').count()
        return ok({
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'all': Product.objects.count(),
        })


# ---------------------------------------------------------------------------
# 审计日志
# ---------------------------------------------------------------------------
class AuditLogListView(APIView):
    """审计日志查询。

    支持的过滤参数：
    - ``keyword``     操作人用户名 / 备注 模糊匹配
    - ``action``      操作类型精确匹配（兼容旧参数）
    - ``action_type`` 操作类型精确匹配（与前端统一）
    - ``start_date``  起始日期（YYYY-MM-DD）
    - ``end_date``    结束日期（YYYY-MM-DD）
    """

    permission_classes = [IsAdminUser]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request):
        """支持 keyword / action / action_type / 时间范围 过滤。"""
        qs = AuditLog.objects.select_related('operator').order_by('-created_at')
        keyword = (request.query_params.get('keyword') or '').strip()
        if keyword:
            from django.db.models import Q
            qs = qs.filter(
                Q(operator__username__icontains=keyword)
                | Q(remark__icontains=keyword)
                | Q(action__icontains=keyword)
            )
        # action / action_type 兼容两种参数名
        action = (request.query_params.get('action') or request.query_params.get('action_type') or '').strip()
        if action:
            qs = qs.filter(action=action)
        # 时间范围（半开区间 [start_date, end_date+1)）
        from datetime import datetime, timedelta
        start_date = (request.query_params.get('start_date') or '').strip()
        end_date = (request.query_params.get('end_date') or '').strip()
        try:
            if start_date:
                dt_start = datetime.strptime(start_date, '%Y-%m-%d')
                qs = qs.filter(created_at__gte=dt_start)
        except (ValueError, TypeError):
            pass
        try:
            if end_date:
                dt_end = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
                qs = qs.filter(created_at__lt=dt_end)
        except (ValueError, TypeError):
            pass
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = AuditLogSerializer(page, many=True)
        return paginator.get_paginated_response(ser.data)
