"""
market.services.ai_service
==========================

AI 业务封装层（对外公开 API）。

本模块是 LLM 与业务之间的"防弹衣"：

1. **统一接口**：
   - :meth:`AiService.publish_assist`     AI 一键发布（拍照识物 + 智能填充）
   - :meth:`AiService.price_suggest`      价格建议（基于同款历史价）
   - :meth:`AiService.content_moderate`   内容审核
   - :meth:`AiService.polish_description` 描述润色
   - :meth:`AiService.negotiate_price`    议价辅助

2. **永不抛错**：每个公开方法都用 ``try/except`` 包裹，失败时返回
   ``is_ai_fallback=True`` 的安全默认值，**不阻塞主流程**。

3. **降级标识**：返回 dict 始终带 ``is_ai_fallback`` 字段；
   前端据此展示灰色「AI 推荐」标识，区分真实 AI 与本地 mock。

4. **依赖**：仅依赖 :mod:`llm_client` / :mod:`ai_prompts` /
   :mod:`ai_data_context`，不直接耦合 Django models，
   使 :mod:`ai_service` 在无 DB 环境下也能跑通导入和单测。

示例
----
>>> svc = get_ai_service()
>>> result = svc.publish_assist(image_url='https://...', draft_text='九成新 iPad')
>>> result['is_ai_fallback']  # True 表示走的是 mock 降级
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any, Optional

from market.services.ai_data_context import (
    build_price_suggest_context,
    build_publish_context,
    format_history_for_prompt,
    get_price_history,
)
from market.services.ai_prompts import (
    CONTENT_MODERATE_PROMPT,
    CUSTOMER_SERVICE_REPLY_PROMPT,
    DESCRIPTION_POLISH_PROMPT,
    KEYWORD_EXTRACT_PROMPT,
    PRICE_NEGOTIATE_PROMPT,
    PRICE_SUGGEST_PROMPT,
    PUBLISH_ASSIST_PROMPT,
    SYSTEM_PROMPT_GENERIC,
)
from market.services.llm_client import (
    LlmClient,
    LlmException,
    build_multimodal_user_content,
    get_llm_client,
)

logger = logging.getLogger(__name__)

_ai_service_singleton: Optional['AiService'] = None


# ---------------------------------------------------------------------------
# 返回结构（TypedDict 风格的 dataclass，便于 IDE 提示与序列化）
# ---------------------------------------------------------------------------
@dataclass
class PublishAssistResult:
    """AI 一键发布的标准化返回。"""

    category: str = '其他'
    category_sub: str = ''
    title: str = ''
    description: str = ''
    suggested_price: float = 0.0
    price_range: list[float] = None  # type: ignore[assignment]
    condition: str = '9成新'
    tags: list[str] = None  # type: ignore[assignment]
    confidence: float = 0.0
    is_ai_fallback: bool = True
    message: str = ''

    def __post_init__(self):
        if self.price_range is None:
            self.price_range = [0.0, 0.0]
        if self.tags is None:
            self.tags = []

    def to_dict(self) -> dict[str, Any]:
        return {
            'category': self.category,
            'category_sub': self.category_sub,
            'title': self.title,
            'description': self.description,
            'suggested_price': round(float(self.suggested_price), 2),
            'price_range': [round(float(x), 2) for x in (self.price_range or [0, 0])],
            'condition': self.condition,
            'tags': list(self.tags or []),
            'confidence': round(float(self.confidence), 2),
            'is_ai_fallback': bool(self.is_ai_fallback),
            'message': self.message,
        }


@dataclass
class PriceSuggestResult:
    """价格建议返回。"""

    low: float = 0.0
    median: float = 0.0
    high: float = 0.0
    reasoning: str = ''
    sample_count: int = 0
    is_ai_fallback: bool = True
    message: str = ''

    def to_dict(self) -> dict[str, Any]:
        return {
            'low': round(float(self.low), 2),
            'median': round(float(self.median), 2),
            'high': round(float(self.high), 2),
            'reasoning': self.reasoning,
            'sample_count': int(self.sample_count),
            'is_ai_fallback': bool(self.is_ai_fallback),
            'message': self.message,
        }


@dataclass
class ContentModerateResult:
    """内容审核返回。"""

    safe: bool = True
    risk_level: str = 'none'
    reasons: list[str] = None  # type: ignore[assignment]
    suggestion: str = '通过'
    is_ai_fallback: bool = True
    message: str = ''

    def __post_init__(self):
        if self.reasons is None:
            self.reasons = []

    def to_dict(self) -> dict[str, Any]:
        return {
            'safe': bool(self.safe),
            'risk_level': self.risk_level,
            'reasons': list(self.reasons or []),
            'suggestion': self.suggestion,
            'is_ai_fallback': bool(self.is_ai_fallback),
            'message': self.message,
        }


# ---------------------------------------------------------------------------
# 业务封装
# ---------------------------------------------------------------------------
class AiService:
    """
    AI 业务封装。所有公开方法都返回 dict（与 dataclass ``to_dict()`` 一致）。
    """

    VALID_CATEGORIES = {'教材', '数码', '服饰', '生活', '其他'}
    VALID_CONDITIONS = {'全新', '9成新', '8成新', '7成新及以下'}

    def __init__(self, llm: LlmClient | None = None):
        self.llm = llm or get_llm_client()

    # ============================================================ 元信息
    def describe(self) -> dict[str, Any]:
        """返回 AI 服务的元信息（不发起真实调用）。

        字段：
            - provider  : 客户端实现来源（'mock' / 'openai-compatible'）
            - model     : 当前配置的模型名
            - has_key   : 是否已配置真实可用的 API Key
            - base_url  : OpenAI 兼容服务基础 URL（mock 时为空）
        """
        llm = self.llm
        provider = 'mock'
        try:
            # LlmClient 通过 is_configured + 实际 base_url 推断 provider
            if getattr(llm, 'is_configured', False) and getattr(llm, 'base_url', ''):
                provider = 'openai-compatible'
        except Exception:  # noqa: BLE001
            provider = 'mock'
        return {
            'provider': provider,
            'model': getattr(llm, 'model', ''),
            'has_key': bool(getattr(llm, 'is_configured', False)),
            'base_url': getattr(llm, 'base_url', ''),
        }

    def health_check(self) -> dict[str, Any]:
        """快速探测 LLM 客户端可用性。失败时返回 ``ok=False``。

        说明：
            - 已配置 Key 时：尝试调用极简 chat（10 token 内）；
            - 未配置 Key 时：直接返回 ok=True 但 message 标注为 mock，
              避免管理后台误报"AI 不可用"。
        """
        llm = self.llm
        if not getattr(llm, 'is_configured', False):
            return {
                'ok': True,
                'mode': 'mock',
                'message': 'AI 服务处于 mock 模式（未配置 Key），可正常返回降级结果。',
            }
        try:
            # 用极简 prompt 做一次握手
            content, _ = llm.chat(
                messages=[{'role': 'user', 'content': 'ping'}],
                temperature=0,
                max_tokens=8,
            )
            return {'ok': True, 'mode': 'live', 'message': f'AI 服务正常（{content[:32]}）'}
        except Exception as exc:  # noqa: BLE001
            return {'ok': False, 'mode': 'live', 'message': f'AI 服务调用失败: {exc}'}

    # ============================================================ 一键发布
    def publish_assist(
        self,
        image_url: str = '',
        draft_text: str = '',
        *,
        image_b64: str | None = None,
        image_mime: str = 'image/jpeg',
    ) -> dict[str, Any]:
        """
        AI 一键发布：拍照识物 + 智能填充。

        Parameters
        ----------
        image_url : str
            已上传图片的公网 URL（推荐）。
        draft_text : str
            用户输入的简短文字描述。
        image_b64 : str, optional
            若 LLM 不可访问外网，可直接传 base64 编码的图片。
        image_mime : str
            图片 MIME，默认 ``image/jpeg``。

        Returns
        -------
        dict
            见 :class:`PublishAssistResult`。
            任意异常都会被捕获并降级为 ``is_ai_fallback=True`` 的 mock。
        """
        draft_text = (draft_text or '').strip()[:200]
        image_note = (
            '已提供图片' if (image_url or image_b64) else '未提供图片，仅依赖文字描述'
        )

        # 1) 准备数据上下文
        try:
            ctx = build_publish_context(draft_text=draft_text)
            history_text = ctx['summary_text']
        except Exception as exc:
            logger.warning('build_publish_context 失败: %s', exc)
            history_text = '暂无同类商品历史成交数据，请按常识合理定价。'

        # 2) 拼装 prompt
        user_prompt = PUBLISH_ASSIST_PROMPT.format(
            image_note=image_note,
            draft_text=draft_text or '（无）',
            price_history=history_text,
        )

        messages = [
            {'role': 'system', 'content': SYSTEM_PROMPT_GENERIC},
            {
                'role': 'user',
                'content': build_multimodal_user_content(
                    text=user_prompt,
                    image_url=image_url or None,
                    image_b64=image_b64 or None,
                    image_mime=image_mime,
                ),
            },
        ]

        # 3) 调用 LLM
        try:
            if not self.llm.is_configured:
                raise LlmException('LLM 未配置，走本地降级', code=50301)
            content, _tokens = self.llm.chat(messages, temperature=0.2, max_tokens=600)
            data = self.llm.parse_json_from_content(content)
            result = self._normalize_publish_result(data, fallback_message='')
            result.is_ai_fallback = False
            result.message = 'AI 智能识别成功'
            return result.to_dict()
        except Exception as exc:
            logger.warning('publish_assist 降级: %s', exc)
            fallback = self._mock_publish_assist(draft_text=draft_text)
            return fallback.to_dict()

    # ============================================================ 价格建议
    def price_suggest(
        self,
        category: str = '',
        condition: str = '9成新',
        current_price: float = 0.0,
        *,
        days: int = 30,
    ) -> dict[str, Any]:
        """
        价格建议：基于同款历史价。

        Parameters
        ----------
        category : str
            一级类目。
        condition : str
            成色。
        current_price : float
            卖家当前定价（用于 LLM 参考，并非强制要求）。
        days : int
            统计窗口，默认 30 天。

        Returns
        -------
        dict
            见 :class:`PriceSuggestResult`。
        """
        try:
            ctx = build_price_suggest_context(
                category=category, condition=condition, days=days
            )
            history = ctx['price_history']
        except Exception as exc:
            logger.warning('build_price_suggest_context 失败: %s', exc)
            history = {
                'sample_count': 0, 'price_min': 0, 'price_median': 0,
                'price_max': 0, 'price_avg': 0, 'days': days,
            }

        # 走 mock
        if not self.llm.is_configured:
            return self._mock_price_suggest(history, current_price).to_dict()

        # 调 LLM
        try:
            user_prompt = PRICE_SUGGEST_PROMPT.format(
                category=category or '其他',
                condition=condition,
                current_price=float(current_price or 0),
                sample_count=history['sample_count'],
                price_min=history['price_min'],
                price_median=history['price_median'],
                price_max=history['price_max'],
                price_avg=history['price_avg'],
            )
            messages = [
                {'role': 'system', 'content': SYSTEM_PROMPT_GENERIC},
                {'role': 'user', 'content': user_prompt},
            ]
            content, _ = self.llm.chat(messages, temperature=0.2, max_tokens=300)
            data = self.llm.parse_json_from_content(content)
            return PriceSuggestResult(
                low=float(data.get('low', history['price_min'])),
                median=float(data.get('median', history['price_median'])),
                high=float(data.get('high', history['price_max'])),
                reasoning=str(data.get('reasoning', ''))[:200],
                sample_count=int(history['sample_count']),
                is_ai_fallback=False,
                message='基于历史成交价的智能估价',
            ).to_dict()
        except Exception as exc:
            logger.warning('price_suggest 降级: %s', exc)
            return self._mock_price_suggest(history, current_price).to_dict()

    # ============================================================ 内容审核
    def content_moderate(self, text: str) -> dict[str, Any]:
        """
        内容审核。

        Parameters
        ----------
        text : str
            待审核文本（标题、描述、聊天消息等）。

        Returns
        -------
        dict
            见 :class:`ContentModerateResult`。
        """
        text = (text or '').strip()
        if not text:
            return ContentModerateResult(
                safe=True, risk_level='none',
                suggestion='通过', is_ai_fallback=True,
                message='文本为空，跳过审核',
            ).to_dict()

        # 1) 关键词本地快速审核（毫秒级，节约 LLM 配额）
        quick = self._quick_keyword_check(text)
        if quick is not None:
            return quick.to_dict()

        # 2) 走 LLM 精细审核
        if not self.llm.is_configured:
            return ContentModerateResult(
                safe=True, risk_level='low',
                suggestion='通过', is_ai_fallback=True,
                message='AI 未启用，已通过本地规则',
            ).to_dict()

        try:
            user_prompt = CONTENT_MODERATE_PROMPT.format(text=text)
            messages = [
                {'role': 'system', 'content': SYSTEM_PROMPT_GENERIC},
                {'role': 'user', 'content': user_prompt},
            ]
            content, _ = self.llm.chat(messages, temperature=0.0, max_tokens=300)
            data = self.llm.parse_json_from_content(content)
            return ContentModerateResult(
                safe=bool(data.get('safe', True)),
                risk_level=str(data.get('risk_level', 'low')),
                reasons=[str(x) for x in data.get('reasons', [])][:10],
                suggestion=str(data.get('suggestion', '通过')),
                is_ai_fallback=False,
                message='AI 审核完成',
            ).to_dict()
        except Exception as exc:
            logger.warning('content_moderate 降级: %s', exc)
            return ContentModerateResult(
                safe=True, risk_level='low',
                suggestion='通过', is_ai_fallback=True,
                message=f'AI 暂不可用: {exc}',
            ).to_dict()

    # ============================================================ 描述润色
    def polish_description(
        self,
        raw_text: str,
        title: str = '',
        category: str = '',
        condition: str = '9成新',
    ) -> dict[str, Any]:
        """
        润色商品描述（纯文本，无图片）。

        Returns
        -------
        dict
            形如 ``{description, highlights, keywords, is_ai_fallback, message}``。
        """
        raw_text = (raw_text or '').strip()
        if not raw_text:
            return {
                'description': '',
                'highlights': [],
                'keywords': [],
                'is_ai_fallback': True,
                'message': '原文为空',
            }

        if not self.llm.is_configured:
            return {
                'description': raw_text[:80],
                'highlights': [],
                'keywords': [],
                'is_ai_fallback': True,
                'message': 'AI 未启用，直接返回原文',
            }

        try:
            user_prompt = DESCRIPTION_POLISH_PROMPT.format(
                raw_text=raw_text,
                title=title or '（无标题）',
                category=category or '其他',
                condition=condition,
            )
            messages = [
                {'role': 'system', 'content': SYSTEM_PROMPT_GENERIC},
                {'role': 'user', 'content': user_prompt},
            ]
            content, _ = self.llm.chat(messages, temperature=0.4, max_tokens=300)
            data = self.llm.parse_json_from_content(content)
            return {
                'description': str(data.get('description', raw_text))[:200],
                'highlights': [str(x)[:12] for x in data.get('highlights', [])][:4],
                'keywords': [str(x)[:12] for x in data.get('keywords', [])][:5],
                'is_ai_fallback': False,
                'message': '润色成功',
            }
        except Exception as exc:
            logger.warning('polish_description 降级: %s', exc)
            return {
                'description': raw_text[:80],
                'highlights': [],
                'keywords': [],
                'is_ai_fallback': True,
                'message': f'AI 暂不可用: {exc}',
            }

    # ============================================================ 议价辅助
    def negotiate_price(
        self,
        title: str,
        current_price: float,
        user_intent: str,
        category: str = '',
    ) -> dict[str, Any]:
        """
        议价辅助：买家在私聊中获取建议出价与开场白。

        Returns
        -------
        dict
            形如 ``{suggest_price, opening_line, strategy, is_ai_fallback, message}``。
        """
        try:
            history = get_price_history(category=category, days=60).to_dict()
        except Exception:
            history = {'price_min': 0, 'price_median': 0, 'price_max': 0}

        if not self.llm.is_configured:
            return {
                'suggest_price': round(float(current_price) * 0.85, 2),
                'opening_line': '同学好，这件商品还在吗？想了解一下~',
                'strategy': '略低于卖家定价，保持礼貌',
                'is_ai_fallback': True,
                'message': 'AI 未启用',
            }

        try:
            user_prompt = PRICE_NEGOTIATE_PROMPT.format(
                title=title or '（商品）',
                current_price=float(current_price or 0),
                market_median=history.get('price_median', 0),
                market_min=history.get('price_min', 0),
                user_intent=(user_intent or '').strip() or '希望以更低价格购入',
            )
            messages = [
                {'role': 'system', 'content': SYSTEM_PROMPT_GENERIC},
                {'role': 'user', 'content': user_prompt},
            ]
            content, _ = self.llm.chat(messages, temperature=0.5, max_tokens=200)
            data = self.llm.parse_json_from_content(content)
            return {
                'suggest_price': round(float(data.get('suggest_price', current_price * 0.85)), 2),
                'opening_line': str(data.get('opening_line', ''))[:120],
                'strategy': str(data.get('strategy', ''))[:80],
                'is_ai_fallback': False,
                'message': '议价建议已生成',
            }
        except Exception as exc:
            logger.warning('negotiate_price 降级: %s', exc)
            return {
                'suggest_price': round(float(current_price or 0) * 0.85, 2),
                'opening_line': '同学好，这件商品还在吗？想了解一下~',
                'strategy': '略低于卖家定价',
                'is_ai_fallback': True,
                'message': f'AI 暂不可用: {exc}',
            }

    # ============================================================ 健康检查
    def health(self) -> dict[str, Any]:
        """返回 AI 服务的健康状态。"""
        return {
            'llm_configured': self.llm.is_configured,
            'base_url': self.llm.base_url,
            'model': self.llm.model,
            'max_retries': self.llm.max_retries,
        }

    # ============================================================ 关键词提取
    def extract_keywords(
        self,
        title: str = '',
        description: str = '',
        *,
        category: str = '',
        max_keywords: int = 6,
    ) -> dict[str, Any]:
        """
        从商品标题与描述中提取搜索关键词与短标签，供搜索 / 推荐 / 审核复用。

        Parameters
        ----------
        title : str
            商品标题。
        description : str
            商品描述。
        category : str
            已知的类目（可空，让 LLM 自己猜）。
        max_keywords : int
            关键词数量上限。

        Returns
        -------
        dict
            形如 ``{keywords, tags, is_product, category_guess, is_ai_fallback, message}``。
        """
        title = (title or '').strip()[:80]
        description = (description or '').strip()[:300]
        if not title and not description:
            return {
                'keywords': [], 'tags': [], 'is_product': False,
                'category_guess': '其他', 'is_ai_fallback': True,
                'message': '标题与描述均为空',
            }

        # 先用本地 jieba/规则做兜底，AI 不可用时仍能给出可接受的关键词
        local_kw, local_tags = self._local_extract_keywords(title, description)

        if not self.llm.is_configured:
            return {
                'keywords': local_kw[:max_keywords],
                'tags': local_tags,
                'is_product': bool(title or description),
                'category_guess': category or '其他',
                'is_ai_fallback': True,
                'message': 'AI 未启用，使用本地关键词规则',
            }

        try:
            user_prompt = KEYWORD_EXTRACT_PROMPT.format(
                title=title or '（无）',
                description=description or '（无）',
                category=category or '未指定',
            )
            messages = [
                {'role': 'system', 'content': SYSTEM_PROMPT_GENERIC},
                {'role': 'user', 'content': user_prompt},
            ]
            content, _ = self.llm.chat(messages, temperature=0.2, max_tokens=300)
            data = self.llm.parse_json_from_content(content)

            # 规整化：去空、去重、限长
            kws: list[str] = []
            seen: set[str] = set()
            for raw in data.get('keywords', []) or []:
                kw = str(raw).strip()[:20]
                if kw and kw not in seen:
                    seen.add(kw)
                    kws.append(kw)
                if len(kws) >= max_keywords:
                    break

            tags: list[str] = []
            seen.clear()
            for raw in data.get('tags', []) or []:
                tag = str(raw).strip()[:6]
                if tag and tag not in seen:
                    seen.add(tag)
                    tags.append(tag)
                if len(tags) >= 4:
                    break

            guess = str(data.get('category_guess', '') or '').strip()
            if guess not in self.VALID_CATEGORIES:
                guess = category if category in self.VALID_CATEGORIES else '其他'

            return {
                'keywords': kws,
                'tags': tags,
                'is_product': bool(data.get('is_product', True)),
                'category_guess': guess,
                'is_ai_fallback': False,
                'message': 'AI 关键词提取完成',
            }
        except Exception as exc:
            logger.warning('extract_keywords 降级: %s', exc)
            return {
                'keywords': local_kw[:max_keywords],
                'tags': local_tags,
                'is_product': bool(title or description),
                'category_guess': category or '其他',
                'is_ai_fallback': True,
                'message': f'AI 暂不可用: {exc}',
            }

    # ============================================================ 智能客服
    def customer_service_reply(
        self,
        product_info: dict[str, Any] | None = None,
        history: list[dict[str, Any]] | None = None,
        incoming: str = '',
        *,
        is_on_sale: bool = True,
        can_negotiate: bool = True,
        support_pickup: bool = True,
        support_express: bool = False,
    ) -> dict[str, Any]:
        """
        AI 智能客服：根据商品信息与对话历史，生成拟人化的回复与候选快捷短语。

        Parameters
        ----------
        product_info : dict
            形如 ``{title, current_price, condition, category, pickup_location, description}``。
        history : list[dict]
            最近对话历史，元素形如 ``{"role": "buyer|seller", "text": "..."}``。
        incoming : str
            买家最新一条消息（用于解析意图）。
        is_on_sale, can_negotiate, support_pickup, support_express : bool
            商品状态位，由前端或后端根据数据库实时填入。

        Returns
        -------
        dict
            形如 ``{reply, intent, suggested_action, quick_replies, is_ai_fallback, message}``。
        """
        product_info = product_info or {}
        title = str(product_info.get('title', ''))[:64]
        try:
            current_price = float(product_info.get('current_price', 0) or 0)
        except (TypeError, ValueError):
            current_price = 0.0
        condition = str(product_info.get('condition', '9成新'))[:16]
        category = str(product_info.get('category', ''))[:16]
        pickup_location = str(product_info.get('pickup_location', ''))[:64]
        description = str(product_info.get('description', ''))[:200]

        history = history or []
        # 渲染对话历史为 prompt 片段
        lines: list[str] = []
        for turn in history[-12:]:  # 最多 12 轮，避免 prompt 过长
            role = str(turn.get('role', '')).strip().lower()
            text = str(turn.get('text', '')).strip()[:200]
            if not text:
                continue
            if role not in ('buyer', 'seller', 'system'):
                role = 'buyer'
            label = {'buyer': '买家', 'seller': '卖家', 'system': '系统'}[role]
            lines.append(f'{label}: {text}')
        history_text = '\n'.join(lines) if lines else '（暂无历史消息）'

        incoming = (incoming or '').strip()[:300]
        if not incoming:
            return {
                'reply': '', 'intent': '其它', 'suggested_action': '等待',
                'quick_replies': [], 'is_ai_fallback': True,
                'message': '买家消息为空',
            }

        if not self.llm.is_configured:
            return self._mock_customer_service_reply(
                title=title, current_price=current_price,
                incoming=incoming, is_on_sale=is_on_sale,
                can_negotiate=can_negotiate,
            )

        try:
            user_prompt = CUSTOMER_SERVICE_REPLY_PROMPT.format(
                title=title or '（商品）',
                current_price=current_price,
                condition=condition,
                category=category or '其他',
                pickup_location=pickup_location or '未填写',
                description=description or '（无）',
                history=history_text,
                incoming=incoming,
            )
            messages = [
                {'role': 'system', 'content': SYSTEM_PROMPT_GENERIC},
                {'role': 'user', 'content': user_prompt},
            ]
            content, _ = self.llm.chat(messages, temperature=0.6, max_tokens=350)
            data = self.llm.parse_json_from_content(content)
            quick = [str(x)[:20] for x in (data.get('quick_replies') or [])][:4]
            return {
                'reply': str(data.get('reply', ''))[:200],
                'intent': str(data.get('intent', '其它'))[:16],
                'suggested_action': str(data.get('suggested_action', '等待'))[:16],
                'quick_replies': quick,
                'is_on_sale': is_on_sale,
                'can_negotiate': can_negotiate,
                'support_pickup': support_pickup,
                'support_express': support_express,
                'is_ai_fallback': False,
                'message': 'AI 客服建议已生成',
            }
        except Exception as exc:
            logger.warning('customer_service_reply 降级: %s', exc)
            return self._mock_customer_service_reply(
                title=title, current_price=current_price,
                incoming=incoming, is_on_sale=is_on_sale,
                can_negotiate=can_negotiate,
            )

    # ======================================================================
    # 内部工具方法
    # ======================================================================
    def _normalize_publish_result(
        self,
        data: dict,
        *,
        fallback_message: str = '',
    ) -> PublishAssistResult:
        """把 LLM 返回的 dict 归一化为 PublishAssistResult，并修正越界值。"""
        category = str(data.get('category', '其他')).strip()
        if category not in self.VALID_CATEGORIES:
            category = '其他'

        condition = str(data.get('condition', '9成新')).strip()
        if condition not in self.VALID_CONDITIONS:
            condition = '9成新'

        try:
            suggested = float(data.get('suggested_price', 0) or 0)
        except (TypeError, ValueError):
            suggested = 0.0

        price_range_raw = data.get('price_range') or [suggested * 0.85, suggested * 1.1]
        try:
            low = float(price_range_raw[0])
            high = float(price_range_raw[1]) if len(price_range_raw) > 1 else low * 1.1
        except (TypeError, ValueError, IndexError):
            low, high = suggested * 0.85, suggested * 1.1

        try:
            confidence = float(data.get('confidence', 0.0) or 0.0)
        except (TypeError, ValueError):
            confidence = 0.0
        confidence = max(0.0, min(1.0, confidence))

        tags = [str(x)[:12] for x in (data.get('tags') or [])][:5]

        return PublishAssistResult(
            category=category,
            category_sub=str(data.get('category_sub', ''))[:20],
            title=str(data.get('title', ''))[:40],
            description=str(data.get('description', ''))[:200],
            suggested_price=round(suggested, 2),
            price_range=[round(low, 2), round(high, 2)],
            condition=condition,
            tags=tags,
            confidence=confidence,
            is_ai_fallback=False,
            message=fallback_message or 'AI 识别成功',
        )

    def _mock_publish_assist(self, draft_text: str) -> PublishAssistResult:
        """无 LLM 时的 mock 结果，从用户文字中猜类目和价格。"""
        text = (draft_text or '').lower()
        if any(k in text for k in ('书', '教材', '考研', '英语', '高数', '课本')):
            category = '教材'
            sub = '教材'
            base = 25.0
        elif any(k in text for k in ('手机', 'iphone', '华为', '小米', 'ipad', '平板', '电脑', '笔记本', '耳机')):
            category = '数码'
            sub = '手机' if '手机' in text or 'iphone' in text else '数码'
            base = 800.0
        elif any(k in text for k in ('上衣', '裤子', '裙子', '外套', '鞋', '卫衣', 't恤', '衣服', '裙子')):
            category = '服饰'
            sub = '服饰'
            base = 50.0
        elif any(k in text for k in ('水杯', '台灯', '收纳', '自行车', '椅子', '桌子', '伞', '生活')):
            category = '生活'
            sub = '生活'
            base = 35.0
        else:
            category = '其他'
            sub = '其他'
            base = 30.0

        # 简单成色识别
        if '全新' in text or '未拆' in text:
            condition = '全新'
            factor = 1.0
        elif '九成' in text or '9成' in text or '9 成' in text:
            condition = '9成新'
            factor = 0.85
        elif '八成' in text or '8成' in text:
            condition = '8成新'
            factor = 0.7
        else:
            condition = '9成新'
            factor = 0.85

        price = round(base * factor, 2)
        return PublishAssistResult(
            category=category,
            category_sub=sub,
            title=(draft_text or f'校园二手{category}')[:20],
            description=(draft_text or f'自用{condition}，当面验货')[:60],
            suggested_price=price,
            price_range=[round(price * 0.85, 2), round(price * 1.1, 2)],
            condition=condition,
            tags=[category, sub, condition, '校园二手'],
            confidence=0.35,
            is_ai_fallback=True,
            message='AI 服务未启用，已按关键词本地生成',
        )

    def _mock_price_suggest(
        self,
        history: dict,
        current_price: float,
    ) -> PriceSuggestResult:
        """无 LLM 时基于历史价的简单建议。"""
        sample = int(history.get('sample_count', 0))
        if sample > 0 and history.get('price_median', 0) > 0:
            median = float(history['price_median'])
            low = float(history['price_min'])
            high = float(history['price_max'])
            return PriceSuggestResult(
                low=round(low, 2),
                median=round(median, 2),
                high=round(high, 2),
                reasoning=f'参考近{history.get("days", 30)}天{sample}笔同类成交',
                sample_count=sample,
                is_ai_fallback=True,
                message='AI 未启用，按历史价给出',
            )
        # 无样本：按当前定价的 0.85~1.0 给个保守区间
        base = float(current_price or 30.0)
        return PriceSuggestResult(
            low=round(base * 0.7, 2),
            median=round(base * 0.85, 2),
            high=round(base, 2),
            reasoning='暂无成交数据，按卖家定价给出保守区间',
            sample_count=0,
            is_ai_fallback=True,
            message='AI 未启用，无历史数据',
        )

    def _quick_keyword_check(self, text: str) -> ContentModerateResult | None:
        """
        关键词本地快速审核，命中明确违规词时立即返回，
        否则返回 None（继续走 LLM）。
        """
        high_risk = [
            '毒品', '冰毒', '海洛因', '大麻', '枪支', '弹药', '管制刀具',
            '代考', '替考', '代写论文', '代课', '办证', '办假证',
        ]
        medium_risk = [
            '微商', '兼职日结', '约炮', '一夜情', '陪睡', '裸聊',
            '高仿', 'A货', '盗版', '破解版', '枪版',
        ]
        low_risk = ['加微信', '加我', '私聊', '二维码', '兼职']

        for kw in high_risk:
            if kw in text:
                return ContentModerateResult(
                    safe=False, risk_level='high',
                    reasons=[f'命中高危词：{kw}'],
                    suggestion='拦截', is_ai_fallback=True,
                    message='本地关键词拦截',
                )
        for kw in medium_risk:
            if kw in text:
                return ContentModerateResult(
                    safe=False, risk_level='medium',
                    reasons=[f'命中违规词：{kw}'],
                    suggestion='人工审核', is_ai_fallback=True,
                    message='本地关键词预警',
                )
        for kw in low_risk:
            if kw in text:
                return ContentModerateResult(
                    safe=True, risk_level='low',
                    reasons=[f'可能擦边：{kw}'],
                    suggestion='警告', is_ai_fallback=True,
                    message='本地关键词提示',
                )
        return None

    # 停用词表（用于本地关键词提取时的过滤）
    _STOPWORDS = {
        '的', '了', '和', '是', '在', '我', '有', '就', '不', '人', '都', '一', '一个',
        '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
        '自己', '这', '那', '里', '就是', '还是', '只是', '但是', '而且', '所以',
    }

    def _local_extract_keywords(
        self,
        title: str,
        description: str,
    ) -> tuple[list[str], list[str]]:
        """
        不依赖 jieba 的简易关键词提取：

        1. 优先保留 title 中长度 2~12 的中文 / 英文 token；
        2. 再补充 description 里出现频率较高的 token；
        3. tags 直接从高频词中截短。
        """
        text = f'{title} {title} {description}'.strip()
        if not text:
            return [], []

        # 中文字符：连续 2~6 个汉字视为一个词；英文/数字：连续 2~20 字符
        tokens = re.findall(r'[\u4e00-\u9fa5]{2,6}|[A-Za-z0-9\-]{2,20}', text)
        freq: dict[str, int] = {}
        for tok in tokens:
            if tok in self._STOPWORDS:
                continue
            freq[tok] = freq.get(tok, 0) + 1

        # 标题里的 token 权重 +1
        for tok in re.findall(r'[\u4e00-\u9fa5]{2,6}|[A-Za-z0-9\-]{2,20}', title):
            if tok in self._STOPWORDS:
                continue
            freq[tok] = freq.get(tok, 0) + 1

        # 排序：频次倒序，长度短的优先
        sorted_tokens = sorted(
            freq.items(),
            key=lambda kv: (-kv[1], len(kv[0])),
        )
        keywords = [tok for tok, _ in sorted_tokens[:8] if len(tok) <= 12]
        # tags 截取更短（≤4 字）的高频 token
        tags = [tok for tok in keywords if 2 <= len(tok) <= 4][:4]
        return keywords, tags

    def _mock_customer_service_reply(
        self,
        title: str,
        current_price: float,
        incoming: str,
        *,
        is_on_sale: bool,
        can_negotiate: bool,
    ) -> dict[str, Any]:
        """
        无 LLM 时基于规则生成客服回复与候选快捷短语。
        覆盖：仍在吗 / 能便宜点 / 自取地点 / 其他。
        """
        text = (incoming or '').strip()

        # 1) 议价意图
        if any(k in text for k in ('便宜', '优惠', '少点', '还价', '降价', '最低多少', '小刀', '刀一下')):
            intent = '议价'
            if not is_on_sale:
                reply = '同学不好意思，这件已经下架啦~ 你可以看看我其他在售商品 :)'
                action = '拒绝'
                quick = ['已下架，看看其他', '私聊沟通']
            elif not can_negotiate:
                reply = '同学好，定价已经是最低啦，诚心想要可以直接拍 :)'
                action = '拒绝'
                quick = ['已经是最低', '可小刀 5 元', '谢谢关注']
            else:
                reply = (
                    f'在的~ 这件{title or "商品"}最低 ¥{round(float(current_price or 0) * 0.9, 2)} 啦，'
                    '同学考虑一下？'
                )
                action = '回复细节'
                quick = ['最低 9 折', '可小刀 5-10 元', '诚心要可包邮']
        # 2) 在售询问
        elif any(k in text for k in ('还在', '在吗', '有没有', '还在吗', '在么')):
            intent = '在售询问'
            if is_on_sale:
                reply = '在的在的，欢迎来看~ 有任何细节问题可以再问我 :)'
                action = '等待'
                quick = ['是的，欢迎来看', '有需要可以私聊', '可以小刀一点点']
            else:
                reply = '同学不好意思，这件已经下架了~ 你可以看看我其他在售商品 :)'
                action = '拒绝'
                quick = ['已下架啦', '看看其他商品']
        # 3) 自取地点
        elif any(k in text for k in ('自取', '在哪', '哪里', '见面', '当面')):
            intent = '自取地点'
            reply = '可以自取哈，地点我在商品详情页有写，可以先看下，不清楚再问我 :)'
            action = '等待'
            quick = ['可以自取', '校门口交易', '我发你定位']
        # 4) 商品细节
        elif any(k in text for k in ('颜色', '尺寸', '多大', '几成', '新', '几成新', '瑕疵', '划痕', '还在保')):
            intent = '商品细节'
            reply = '具体细节都在商品描述里啦~ 有啥疑问随时问我 :)'
            action = '回复细节'
            quick = ['描述里都有', '可以私聊看图', '欢迎自取验货']
        # 5) 物流
        elif any(k in text for k in ('快递', '包邮', '邮费', '发货', '顺丰')):
            intent = '物流'
            reply = '可以发快递，邮费按实际重量算，珠三角内可包邮 :)'
            action = '回复细节'
            quick = ['可发顺丰', '江浙沪包邮', '自取更划算']
        # 6) 售后
        elif any(k in text for k in ('售后', '退货', '退换', '有问题')):
            intent = '售后'
            reply = '当面验货后离手不退哈，建议自取当面确认 :)'
            action = '回复细节'
            quick = ['当面验货不退', '支持当面交易', '可小刀不退']
        else:
            intent = '其它'
            reply = f'收到~ 同学对{title or "这件商品"}还有什么想了解的吗？'
            action = '等待'
            quick = ['欢迎咨询', '可以小刀', '支持自取']

        return {
            'reply': reply[:200],
            'intent': intent,
            'suggested_action': action,
            'quick_replies': [q[:20] for q in quick][:4],
            'is_on_sale': is_on_sale,
            'can_negotiate': can_negotiate,
            'support_pickup': True,
            'support_express': True,
            'is_ai_fallback': True,
            'message': 'AI 未启用，已按本地规则生成',
        }


# ---------------------------------------------------------------------------
# 工厂 / 单例
# ---------------------------------------------------------------------------
def get_ai_service() -> AiService:
    """获取 AiService 单例。"""
    global _ai_service_singleton
    if _ai_service_singleton is None:
        _ai_service_singleton = AiService()
    return _ai_service_singleton


def reset_ai_service() -> None:
    """管理端改完 LLM 配置后，清除单例以使新配置生效。"""
    global _ai_service_singleton
    _ai_service_singleton = None
