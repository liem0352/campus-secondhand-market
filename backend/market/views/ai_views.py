"""
market.views.ai_views
======================

AI 视图 — 全部委托给 :mod:`market.services.ai_service`。
- :class:`AiPublishAssistView`   POST /api/ai/publish-assist/
- :class:`AiPriceSuggestView`    GET  /api/ai/price-suggest/
- :class:`AiModerateView`        POST /api/ai/moderate/
- :class:`AiPolishView`          POST /api/ai/polish/
- :class:`AiNegotiateView`       POST /api/ai/negotiate/
- :class:`AiExtractKeywordsView` POST /api/ai/extract-keywords/
- :class:`AiCustomerServiceView` POST /api/ai/customer-service/
- :class:`AiGeneralChatView`     POST /api/ai/chat/      AI 通用问答（小程序 AI 助手页）
- :class:`AiHealthView`          GET  /api/ai/health/
"""
import logging

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from market.exceptions import ValidationException
from market.response import ok
from market.services.ai_service import get_ai_service

logger = logging.getLogger(__name__)


class _AiBase(APIView):
    """AI 视图的公共基类：要求登录 + 提供 ``self.ai`` 单例。"""

    permission_classes = [IsAuthenticated]

    @property
    def ai(self):
        """懒加载 AI 服务单例。"""
        return get_ai_service()


class AiPublishAssistView(_AiBase):
    """AI 一键发布（拍照识物 + 智能填充）。"""

    def post(self, request):
        """接收 ``{image_url?, draft_text?, image_b64?, image_mime?}``。"""
        image_url = (request.data.get('image_url') or '').strip()
        draft_text = (request.data.get('draft_text') or '').strip()
        image_b64 = (request.data.get('image_b64') or '').strip() or None
        image_mime = (request.data.get('image_mime') or 'image/jpeg').strip()
        if not (image_url or image_b64 or draft_text):
            raise ValidationException('image_url / image_b64 / draft_text 至少提供一个')
        result = self.ai.publish_assist(
            image_url=image_url,
            draft_text=draft_text,
            image_b64=image_b64,
            image_mime=image_mime,
        )
        return ok(result, 'AI 识别完成')


class AiPriceSuggestView(_AiBase):
    """AI 价格建议。"""

    def get(self, request):
        """接收 query: ``category``, ``condition``, ``current_price``。"""
        category = request.query_params.get('category', '')
        condition = request.query_params.get('condition', '9成新')
        try:
            current_price = float(request.query_params.get('current_price', 0) or 0)
        except (TypeError, ValueError):
            current_price = 0.0
        result = self.ai.price_suggest(
            category=category, condition=condition, current_price=current_price,
        )
        return ok(result)


class AiModerateView(_AiBase):
    """AI 内容审核。"""

    def post(self, request):
        """接收 ``{text}``。"""
        text = (request.data.get('text') or '').strip()
        if not text:
            raise ValidationException('text 不能为空')
        return ok(self.ai.content_moderate(text))


class AiPolishView(_AiBase):
    """AI 商品描述润色。"""

    def post(self, request):
        """接收 ``{raw_text, title?, category?, condition?}``。"""
        raw_text = (request.data.get('raw_text') or '').strip()
        if not raw_text:
            raise ValidationException('raw_text 不能为空')
        title = (request.data.get('title') or '').strip()
        category = (request.data.get('category') or '').strip()
        condition = (request.data.get('condition') or '9成新').strip()
        return ok(self.ai.polish_description(
            raw_text=raw_text, title=title, category=category, condition=condition,
        ))


class AiNegotiateView(_AiBase):
    """AI 议价建议。"""

    def post(self, request):
        """接收 ``{title, current_price, user_intent, category?}``。"""
        title = (request.data.get('title') or '').strip()
        try:
            current_price = float(request.data.get('current_price', 0) or 0)
        except (TypeError, ValueError):
            current_price = 0.0
        user_intent = (request.data.get('user_intent') or '').strip()
        category = (request.data.get('category') or '').strip()
        if not user_intent:
            raise ValidationException('user_intent 不能为空')
        return ok(self.ai.negotiate_price(
            title=title, current_price=current_price,
            user_intent=user_intent, category=category,
        ))


class AiHealthView(APIView):
    """AI 健康检查（无需鉴权，便于监控探活）。"""

    permission_classes: list = []

    def get(self, request):
        """返回 LLM 配置状态。"""
        return ok(get_ai_service().health())


class AiExtractKeywordsView(_AiBase):
    """AI 关键词提取（用于搜索 / 推荐）。"""

    def post(self, request):
        """接收 ``{title?, description?, category?}``。"""
        title = (request.data.get('title') or '').strip()
        description = (request.data.get('description') or '').strip()
        category = (request.data.get('category') or '').strip()
        if not title and not description:
            raise ValidationException('title / description 至少提供一个')
        try:
            max_keywords = int(request.data.get('max_keywords', 6) or 6)
        except (TypeError, ValueError):
            max_keywords = 6
        return ok(self.ai.extract_keywords(
            title=title,
            description=description,
            category=category,
            max_keywords=max_keywords,
        ))


class AiCustomerServiceView(_AiBase):
    """AI 智能客服：基于商品信息 + 对话历史生成卖家回复建议。"""

    def post(self, request):
        """
        接收::

            {
              "product_info": {"title", "current_price", "condition",
                                "category", "pickup_location", "description"},
              "history": [{"role": "buyer|seller", "text": "..."}],
              "incoming": "买家最新消息",
              "is_on_sale": true,
              "can_negotiate": true,
              "support_pickup": true,
              "support_express": false
            }
        """
        product_info = request.data.get('product_info') or {}
        if not isinstance(product_info, dict):
            product_info = {}
        history = request.data.get('history') or []
        if not isinstance(history, list):
            history = []
        incoming = (request.data.get('incoming') or '').strip()
        if not incoming:
            raise ValidationException('incoming 不能为空')

        def _bool(name: str, default: bool) -> bool:
            """把请求字段宽松解析为 bool（兼容 true/1/"true"/"1"）。"""
            val = request.data.get(name, default)
            if isinstance(val, bool):
                return val
            if isinstance(val, (int, float)):
                return val != 0
            if isinstance(val, str):
                return val.strip().lower() in ('1', 'true', 'yes', 'on')
            return default

        return ok(self.ai.customer_service_reply(
            product_info=product_info,
            history=history,
            incoming=incoming,
            is_on_sale=_bool('is_on_sale', True),
            can_negotiate=_bool('can_negotiate', True),
            support_pickup=_bool('support_pickup', True),
            support_express=_bool('support_express', False),
        ))


class AiGeneralChatView(_AiBase):
    """AI 通用问答（小程序 AI 助手页用）。

    接收::

        {
          "question": "用户问题",
          "history": [{"role": "user|assistant", "text": "..."}]
        }

    返回::

        {
          "answer": "AI 回答",
          "is_ai_fallback": false,
          "message": "AI 智能回答"
        }

    降级策略：未配置 LLM 时根据 question 给出常见问答模板，
    保证前端不报错、可正常展示。
    """

    def post(self, request):
        """调用 LLM 通用问答；失败时返回 FAQ 模板。"""
        question = (request.data.get('question') or request.data.get('incoming') or '').strip()
        if not question:
            raise ValidationException('question 不能为空')
        history = request.data.get('history') or []
        if not isinstance(history, list):
            history = []

        # 1) 优先走 LLM
        from market.services.llm_client import LlmException
        try:
            from market.services.ai_prompts import SYSTEM_PROMPT_GENERIC
            sys_prompt = SYSTEM_PROMPT_GENERIC
            user_prompt = (
                '你是校园二手交易平台"易物助手"，请基于以下上下文回答用户问题。\n'
                '问题：' + question + '\n'
                '如果问题与二手交易 / 校园生活无关，请礼貌引导回到平台话题。'
            )
            messages = [{'role': 'system', 'content': sys_prompt}]
            # 追加历史
            for h in history[-6:]:
                role = (h.get('role') or 'user').lower()
                text = (h.get('text') or '').strip()
                if not text:
                    continue
                if role in ('assistant', 'ai', 'bot'):
                    messages.append({'role': 'assistant', 'content': text})
                else:
                    messages.append({'role': 'user', 'content': text})
            messages.append({'role': 'user', 'content': user_prompt})

            answer = self.ai.llm.chat(messages, temperature=0.4, max_tokens=500)
            if isinstance(answer, tuple):
                content = answer[0]
            else:
                content = answer
            content = (content or '').strip()
            if not content:
                raise LlmException('LLM 返回空', code=50302)
            return ok({'answer': content, 'is_ai_fallback': False, 'message': 'AI 智能回答'})
        except Exception as exc:
            logger.warning('general_chat 降级: %s', exc)
            # 2) 走本地 FAQ 模板
            fallback = self._mock_general_answer(question)
            return ok(fallback)

    @staticmethod
    def _mock_general_answer(question: str) -> dict:
        """LLM 不可用时给出本地 FAQ 模板（永不抛错）。"""
        q = (question or '').lower()
        # FAQ 关键词 → 回答
        faq = [
            (('发布', '上架', '卖'), '发布流程：进入「发布」tab → 拍照/选图 → 填写标题、价格、描述 → 提交。审核通过后自动上架。'),
            (('价格', '定价', '多少钱'), '建议参考同款历史成交价：进入商品详情页可见「价格参考」区间。'),
            (('信用', '分数'), '信用分 0-100：按时发货、积极沟通、收到好评可加分；违规会扣分。'),
            (('私聊', '聊天', '联系'), '在商品详情页点击「私聊议价」即可发起对话。'),
            (('订单', '状态', '发货'), '订单状态：已申请 → 已确认 → 待取/待发 → 已完成。'),
            (('退款', '退货'), '若双方未实际见面且产生争议，可在订单详情页申请平台介入。'),
            (('安全', '骗子', '诈骗'), '请坚持走平台私聊 + 自取/当面验货；切勿脱离平台转账。'),
        ]
        for keys, ans in faq:
            if any(k in question for k in keys) or any(k in q for k in keys):
                return {'answer': ans, 'is_ai_fallback': True, 'message': '本地 FAQ（AI 未配置）'}
        return {
            'answer': '抱歉，我当前只了解校园二手交易相关的问题。你可以问我：怎么发布商品？价格怎么定？信用分怎么涨？',
            'is_ai_fallback': True,
            'message': '本地 FAQ（AI 未配置）',
        }
