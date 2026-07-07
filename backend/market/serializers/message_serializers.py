"""
market.serializers.message_serializers
======================================

会话 / 消息 序列化器。
- :class:`MessageSerializer`         单条消息
- :class:`ConversationSerializer`    会话（带 peer / 未读数）
- :class:`SendMessageSerializer`     客户端发送消息入参
"""
from rest_framework import serializers

from market.models import Conversation, Message

from .user_serializers import UserBriefSerializer


class MessageSerializer(serializers.ModelSerializer):
    """私聊消息序列化器。

    字段说明：
        id            消息主键
        conversation  所属会话
        sender        发送方简要
        content       消息内容
        is_read       是否已读
        created_at    发送时间
    """

    sender = UserBriefSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'is_read', 'created_at']
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    """会话序列化器（带对方 + 未读数）。

    字段说明：
        id              会话主键
        product         关联商品（简要 — 仅 ID；前端需要时再请求详情）
        peer            对方（基于 request.user 自动决定 buyer / seller）
        last_message    最后一条消息预览
        last_message_at 最后消息时间
        unread          当前用户未读数
        updated_at      会话最后更新时间
    """

    peer = serializers.SerializerMethodField()
    unread = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True, default='')
    product_cover = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'product', 'product_id', 'product_title', 'product_cover',
            'peer', 'last_message', 'last_message_at', 'unread',
            'created_at', 'updated_at',
        ]

    def get_peer(self, obj: Conversation):
        """返回"对方"用户简要：根据 request.user 自动选 buyer / seller。"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.id == obj.buyer_id:
                peer = obj.seller
            elif request.user.id == obj.seller_id:
                peer = obj.buyer
            else:
                # 既不是 buyer 也不是 seller，返回 seller 兜底
                peer = obj.seller
        else:
            peer = obj.seller
        return UserBriefSerializer(peer, context=self.context).data

    def get_unread(self, obj: Conversation) -> int:
        """当前用户在该会话的未读消息数。"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        if request.user.id == obj.buyer_id:
            return obj.unread_buyer
        if request.user.id == obj.seller_id:
            return obj.unread_seller
        return 0

    def get_product_cover(self, obj: Conversation) -> str:
        """关联商品的封面图。"""
        first = obj.product.images.first() if obj.product_id else None
        return first.image_url if first else ''


class SendMessageSerializer(serializers.Serializer):
    """发送消息入参。"""

    conversation_id = serializers.IntegerField(required=False)
    product_id = serializers.IntegerField(required=False)
    content = serializers.CharField(max_length=1000)
    client_id = serializers.CharField(max_length=64, required=False, allow_blank=True, default='')
