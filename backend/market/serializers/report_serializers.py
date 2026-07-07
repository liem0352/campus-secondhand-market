"""
market.serializers.report_serializers
=====================================

举报相关序列化器。
- :class:`ReportSerializer` 举报详情（含被举报商品 / 举报人 / 处理人）
- :class:`ReportCreateSerializer` 用户提交举报入参
"""
from rest_framework import serializers

from market.models import Report

from .user_serializers import UserBriefSerializer


class ReportSerializer(serializers.ModelSerializer):
    """举报序列化器 — 管理后台使用。"""

    reporter = UserBriefSerializer(read_only=True)
    handler = UserBriefSerializer(read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True, default='')
    # 卖家用户名（方便表格列直接展示，避免多次取 product.seller）
    seller_name = serializers.SerializerMethodField()
    # 处理动作显示标签
    action_display = serializers.SerializerMethodField()
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'product', 'product_title', 'seller_name',
            'reason', 'reason_display', 'description',
            'status', 'status_display', 'action', 'action_display', 'remark',
            'handled_at', 'handler',
            'created_at',
        ]
        read_only_fields = fields

    def get_seller_name(self, obj: Report) -> str:
        """返回被举报商品卖家用户名（便于列表展示）。"""
        if obj.product and getattr(obj.product, 'seller', None):
            return obj.product.seller.username or ''
        return ''

    def get_action_display(self, obj: Report) -> str:
        """处理动作 -> 中文标签。"""
        return {
            'warn':   '警告卖家',
            'remove': '下架商品',
            'ban':    '封禁卖家',
            'reject': '驳回举报',
        }.get(obj.action or '', '')


class ReportCreateSerializer(serializers.Serializer):
    """用户提交举报入参。"""

    product_id = serializers.IntegerField()
    reason = serializers.ChoiceField(choices=Report.REASON_CHOICES)
    description = serializers.CharField(max_length=300, required=False, allow_blank=True, default='')


class ReportHandleSerializer(serializers.Serializer):
    """管理员处理举报入参。"""

    action = serializers.ChoiceField(choices=['warn', 'remove', 'ban', 'reject'])
    remark = serializers.CharField(max_length=128, required=False, allow_blank=True, default='')
