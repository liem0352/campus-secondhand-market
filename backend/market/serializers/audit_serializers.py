"""
market.serializers.audit_serializers
====================================

审计日志序列化器。
- :class:`AuditLogSerializer` 审计日志详情（管理后台用）
"""
from rest_framework import serializers

from market.models import AuditLog

from .user_serializers import UserBriefSerializer


class AuditLogSerializer(serializers.ModelSerializer):
    """审计日志序列化器。"""

    operator = UserBriefSerializer(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'operator', 'action', 'action_display',
            'target_type', 'target_id', 'remark', 'created_at',
        ]
        read_only_fields = fields
