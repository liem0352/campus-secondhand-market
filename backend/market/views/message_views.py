"""
market.views.message_views
===========================

会话 / 消息 视图。
- :class:`ConversationListCreateView`   GET/POST /api/conversations/
- :class:`ConversationDetailView`        GET     /api/conversations/{id}/
- :class:`ConversationMessagesView`      GET     /api/conversations/{id}/messages/?since=ts
- :class:`SendMessageView`               POST    /api/messages/send/
- :class:`MarkReadView`                  POST    /api/conversations/{id}/read/
"""
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from market.exceptions import PermissionDeniedException, ValidationException
from market.models import Conversation, Message, Product
from market.pagination import EnvelopePageNumberPagination
from market.response import created, ok
from market.serializers.message_serializers import (
    ConversationSerializer,
    MessageSerializer,
    SendMessageSerializer,
)


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------
def _get_user_conversation(user, pk):
    """取指定会话并校验当前用户是 buyer / seller 之一。"""
    conv = get_object_or_404(
        Conversation.objects.select_related('product', 'buyer', 'seller'),
        pk=pk,
    )
    if user.id not in (conv.buyer_id, conv.seller_id):
        raise PermissionDeniedException('无权访问该会话')
    return conv


# ---------------------------------------------------------------------------
# 会话列表 + 创建
# ---------------------------------------------------------------------------
class ConversationListCreateView(APIView):
    """会话列表 / 创建会话。

    GET  /api/conversations/         列出当前用户全部会话
    POST /api/conversations/         创建或获取会话（body: {product_id, peer_id}）
    """

    permission_classes = [IsAuthenticated]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request):
        """分页返回当前用户的会话。"""
        from django.db.models import F, Q
        qs = (
            Conversation.objects
            .filter(Q(buyer=request.user) | Q(seller=request.user))
            .select_related('product', 'buyer', 'seller')
            .prefetch_related('product__images')
            # 注意：Django 的 order_by 接受字符串参数，"-" 前缀表示倒序；
            # 不能写成 F('-last_message_at')，否则负号会被当作字段名一部分导致 FieldError。
            .order_by(F('last_message_at').desc(nulls_last=True), '-updated_at')
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = ConversationSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(ser.data)

    def post(self, request):
        """根据 product_id 找/创建会话；当前用户即 buyer，对方是 seller。"""
        product_id = request.data.get('product_id')
        if not product_id:
            raise ValidationException('缺少 product_id')
        product = get_object_or_404(Product, pk=product_id)
        if product.seller_id == request.user.id:
            raise PermissionDeniedException('不能与自己创建会话')

        # 已有会话直接返回（先按 (product, buyer) 命中）
        conv = Conversation.objects.filter(product=product, buyer=request.user).first()
        if conv:
            return ok(ConversationSerializer(conv, context={'request': request}).data)
        # 并发场景下捕获唯一键冲突，重复查一次后返回已有会话
        from django.db import IntegrityError
        try:
            conv = Conversation.objects.create(
                product=product,
                buyer=request.user,
                seller=product.seller,
            )
        except IntegrityError:
            conv = Conversation.objects.filter(product=product, buyer=request.user).first()
            if not conv:
                # 仍然拿不到说明有更深层错误，让上层异常处理兜底
                raise
        return created(ConversationSerializer(conv, context={'request': request}).data)


# ---------------------------------------------------------------------------
# 会话详情
# ---------------------------------------------------------------------------
class ConversationDetailView(APIView):
    """会话详情。"""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """返回指定会话的元信息。"""
        conv = _get_user_conversation(request.user, pk)
        return ok(ConversationSerializer(conv, context={'request': request}).data)


# ---------------------------------------------------------------------------
# 会话消息列表（支持 ?since 增量）
# ---------------------------------------------------------------------------
class ConversationMessagesView(APIView):
    """会话历史消息。

    GET /api/conversations/{id}/messages/?since=ISO_DATETIME
    """

    permission_classes = [IsAuthenticated]
    pagination_class = EnvelopePageNumberPagination

    def get(self, request, pk):
        """分页 + 增量返回消息。"""
        conv = _get_user_conversation(request.user, pk)
        qs = Message.objects.filter(conversation=conv)\
            .select_related('sender').order_by('created_at')
        since = request.query_params.get('since')
        if since:
            try:
                # 解析 ISO 时间
                from django.utils.dateparse import parse_datetime
                dt = parse_datetime(since)
                if dt:
                    qs = qs.filter(created_at__gt=dt)
            except (ValueError, TypeError):
                pass
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        ser = MessageSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(ser.data)


# ---------------------------------------------------------------------------
# 发送消息
# ---------------------------------------------------------------------------
class SendMessageView(APIView):
    """发送消息。

    POST /api/messages/send/
    body: ``{conversation_id?, product_id?, content, client_id?}``
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """保存消息并维护会话的 last_message / 未读数。"""
        ser = SendMessageSerializer(data=request.data)
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        data = ser.validated_data
        content = data['content'].strip()
        if not content:
            raise ValidationException('消息内容不能为空')

        conv_id = data.get('conversation_id')
        product_id = data.get('product_id')
        conv = None
        if conv_id:
            conv = _get_user_conversation(request.user, conv_id)
        elif product_id:
            # 通过商品隐式创建
            product = get_object_or_404(Product, pk=product_id)
            if product.seller_id == request.user.id:
                raise PermissionDeniedException('不能与自己创建会话')
            conv = Conversation.objects.filter(product=product, buyer=request.user).first()
            if not conv:
                conv = Conversation.objects.create(
                    product=product,
                    buyer=request.user,
                    seller=product.seller,
                )
        else:
            raise ValidationException('缺少 conversation_id 或 product_id')

        # 写入消息
        msg = Message.objects.create(
            conversation=conv,
            sender=request.user,
            content=content,
        )
        # 更新会话元信息
        conv.last_message = content[:200]
        conv.last_message_at = msg.created_at
        # 对方未读 +1
        if request.user.id == conv.buyer_id:
            conv.unread_seller = (conv.unread_seller or 0) + 1
        else:
            conv.unread_buyer = (conv.unread_buyer or 0) + 1
        conv.save(update_fields=['last_message', 'last_message_at', 'unread_buyer', 'unread_seller', 'updated_at'])

        return created({
            'id': msg.id,
            'conversation_id': conv.id,
            'client_id': data.get('client_id', ''),
            'content': msg.content,
            'created_at': msg.created_at,
            'sender_id': msg.sender_id,
        })


# ---------------------------------------------------------------------------
# 标记已读
# ---------------------------------------------------------------------------
class MarkReadView(APIView):
    """将会话中对方的未读数清零。"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """根据当前用户身份清零对应未读字段。"""
        conv = _get_user_conversation(request.user, pk)
        if request.user.id == conv.buyer_id:
            conv.unread_buyer = 0
        elif request.user.id == conv.seller_id:
            conv.unread_seller = 0
        conv.save(update_fields=['unread_buyer', 'unread_seller', 'updated_at'])
        # 同时将该会话下所有对方发的消息置为已读
        Message.objects.filter(
            conversation=conv, is_read=False,
        ).exclude(sender=request.user).update(is_read=True)
        return ok({'unread': 0})
