"""
market.services.ai_data_context
===============================

为 AI 服务准备本地数据上下文。

核心职责
--------
1. **同款历史价**：根据类目 + 关键词，统计最近 N 天已成交商品的价格分布
   （样本数 / 最低 / 中位 / 最高 / 平均），供 LLM 估价。
2. **隐私保护**：剔除所有用户身份信息（昵称、学号、头像 URL 等），
   仅保留价格 / 时间 / 类目等聚合统计。
3. **容错**：当 :mod:`market.models` 尚未生成时，**不抛错**，
   返回空数据结构，使 :mod:`ai_service` 仍可走纯 LLM 或 mock 降级路径。

数据查询函数
------------
- :func:`get_price_history`         单一类目历史价
- :func:`get_keyword_price_history` 关键词模糊匹配的历史价
- :func:`build_publish_context`     一键发布专用上下文
- :func:`build_price_suggest_context` 议价专用上下文
- :func:`format_history_for_prompt` 把统计数据格式化为 prompt 片段
"""

from __future__ import annotations

import logging
import statistics
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 容错导入：market.models 尚未生成时返回 None
# ---------------------------------------------------------------------------
def _try_import_models():
    """
    尝试导入 market.models 中的关键类。

    Returns
    -------
    tuple
        ``(Product, Order, Category)``，任意一个不存在则对应位置为 None。
    """
    Product = Order = Category = None
    try:
        from market.models import Product  # type: ignore
    except Exception:  # ImportError / AppRegistryNotReady 等
        Product = None
    try:
        from market.models import Order  # type: ignore
    except Exception:
        Order = None
    try:
        from market.models import Category  # type: ignore
    except Exception:
        Category = None
    return Product, Order, Category


# 启动时尝试一次
_PRODUCT_MODEL, _ORDER_MODEL, _CATEGORY_MODEL = _try_import_models()


# ---------------------------------------------------------------------------
# 返回结构
# ---------------------------------------------------------------------------
@dataclass
class PriceHistory:
    """同款历史价聚合结果。"""

    sample_count: int = 0
    price_min: float = 0.0
    price_median: float = 0.0
    price_max: float = 0.0
    price_avg: float = 0.0
    days: int = 30
    category: str = ''

    def to_dict(self) -> dict[str, Any]:
        return {
            'sample_count': self.sample_count,
            'price_min': round(self.price_min, 2),
            'price_median': round(self.price_median, 2),
            'price_max': round(self.price_max, 2),
            'price_avg': round(self.price_avg, 2),
            'days': self.days,
            'category': self.category,
        }

    def is_empty(self) -> bool:
        return self.sample_count == 0


# ---------------------------------------------------------------------------
# 查询函数
# ---------------------------------------------------------------------------
def get_price_history(
    category: str = '',
    *,
    days: int = 30,
    limit: int = 200,
) -> PriceHistory:
    """
    查询类目下"已完成订单"的商品成交价统计。

    Parameters
    ----------
    category : str
        一级类目（教材/数码/服饰/生活/其他），空字符串表示不按类目筛选。
    days : int
        统计最近 N 天内的成交，默认 30。
    limit : int
        最多读取多少条商品记录（避免大数据量拖慢 LLM）。

    Returns
    -------
    PriceHistory
        含样本数 / 最低 / 中位 / 最高 / 平均。
        当 :class:`market.models.Product` 未定义或无数据时，
        返回 ``sample_count=0`` 的空对象。
    """
    if _PRODUCT_MODEL is None or _ORDER_MODEL is None:
        logger.debug('market.models 尚未就绪，返回空价格历史')
        return PriceHistory(days=days, category=category)

    since = date.today() - timedelta(days=days)
    try:
        # 仅统计已完成的订单对应商品成交价（订单已自带 price 快照，比商品当前价更准确）
        completed_orders = _ORDER_MODEL.objects.filter(
            status='completed',
            updated_at__date__gte=since,
        ).values_list('price', 'product_id')[:limit]

        # 1) 类目过滤：Product.category 是外键，这里按 Category.name 或 code 解析
        category_ids: list[int] | None = None
        if category:
            category_ids = _resolve_category_ids(category)
            if not category_ids:
                # 类目名 / code 都无法解析为有效类目，直接返回空
                return PriceHistory(days=days, category=category)

        prices: list[float] = []
        for order_price, product_id in completed_orders:
            try:
                if category_ids is not None:
                    # 二次校验商品所属类目，避免订单历史中存在已下架类目
                    prod_cat_id = _PRODUCT_MODEL.objects.filter(
                        id=product_id,
                    ).values_list('category_id', flat=True).first()
                    if prod_cat_id not in category_ids:
                        continue
                prices.append(float(order_price))
            except (TypeError, ValueError):
                continue
    except Exception as exc:  # DB 未迁移、字段不存在等
        logger.warning('get_price_history 失败，返回空: %s', exc)
        return PriceHistory(days=days, category=category)

    return _aggregate_prices(prices, days=days, category=category)


def _resolve_category_ids(category: str) -> list[int]:
    """
    将字符串形式的类目（中文名 / code）解析为 Category 主键列表。

    - 空字符串返回空列表（调用方应自行决定是否过滤）
    - 先按 name 精确匹配，再按 code 精确匹配
    - 支持二级类目：若命中二级类目，也回溯其一级类目，便于聚合
    """
    if not category or _CATEGORY_MODEL is None:
        return []
    try:
        # 先按 name 精确匹配；空集合再按 code 匹配（前端可能传 code）
        matched = list(
            _CATEGORY_MODEL.objects.filter(
                name=category,
            ).values_list('id', 'parent_id')
        )
        if not matched:
            matched = list(
                _CATEGORY_MODEL.objects.filter(
                    code=category,
                ).values_list('id', 'parent_id')
            )
        if not matched:
            return []
        ids: set[int] = {cid for cid, _ in matched}
        # 把父类目也带上，让一级类目查询能包含子分类的商品
        for _, parent_id in matched:
            if parent_id:
                ids.add(parent_id)
        return list(ids)
    except Exception as exc:
        logger.debug('_resolve_category_ids 失败: %s', exc)
        return []


def get_keyword_price_history(
    keyword: str,
    *,
    days: int = 60,
    limit: int = 200,
) -> PriceHistory:
    """
    按关键词（标题模糊匹配）查询历史价。

    用于 LLM 在发布阶段仅凭用户输入"九成新 iPad"也能拿到价格参考。
    """
    if not keyword or _PRODUCT_MODEL is None:
        return PriceHistory(days=days)

    since = date.today() - timedelta(days=days)
    try:
        qs = _PRODUCT_MODEL.objects.filter(
            title__icontains=keyword,
            created_at__date__gte=since,
            status__in=('on_sale', 'sold', 'pending'),
        )[:limit]
        prices = [float(p.price) for p in qs if p and getattr(p, 'price', None)]
    except Exception as exc:
        logger.warning('get_keyword_price_history 失败: %s', exc)
        return PriceHistory(days=days)

    return _aggregate_prices(prices, days=days)


def _aggregate_prices(
    prices: list[float],
    *,
    days: int,
    category: str = '',
) -> PriceHistory:
    """把价格列表聚合成 PriceHistory。空列表时返回空对象。"""
    if not prices:
        return PriceHistory(days=days, category=category)
    return PriceHistory(
        sample_count=len(prices),
        price_min=min(prices),
        price_max=max(prices),
        price_avg=round(sum(prices) / len(prices), 2),
        price_median=round(statistics.median(prices), 2),
        days=days,
        category=category,
    )


# ---------------------------------------------------------------------------
# 上下文构建（给 LLM 用）
# ---------------------------------------------------------------------------
def build_publish_context(
    draft_text: str = '',
    category: str = '',
) -> dict[str, Any]:
    """
    为"AI 一键发布"准备上下文。

    Returns
    -------
    dict
        包含：
        - ``price_history``    : PriceHistory.to_dict()
        - ``has_keyword_match``: 是否命中关键词历史价
        - ``summary_text``     : 直接拼好的中文上下文片段（喂给 prompt）
    """
    history = get_price_history(category=category, days=30)
    if history.is_empty() and draft_text:
        # 退化：按用户输入关键词二次尝试
        kw_history = get_keyword_price_history(draft_text, days=60)
        if not kw_history.is_empty():
            history = kw_history

    return {
        'price_history': history.to_dict(),
        'has_keyword_match': history.sample_count > 0,
        'summary_text': format_history_for_prompt(history),
    }


def build_price_suggest_context(
    category: str = '',
    condition: str = '',
    *,
    days: int = 30,
) -> dict[str, Any]:
    """
    为"议价建议"准备上下文（类目 + 成色）。
    """
    history = get_price_history(category=category, days=days)
    return {
        'price_history': history.to_dict(),
        'summary_text': format_history_for_prompt(history),
        'condition': condition,
    }


def format_history_for_prompt(history: PriceHistory) -> str:
    """
    把 PriceHistory 格式化为可直接拼入 prompt 的中文片段。

    无样本时返回友好提示，避免 LLM 强行编造。
    """
    if history.is_empty():
        return '暂无同类商品历史成交数据，请按常识合理定价。'
    return (
        f'近{history.days}天同类商品成交{history.sample_count}笔：'
        f'最低¥{history.price_min}，中位¥{history.price_median}，'
        f'最高¥{history.price_max}，平均¥{history.price_avg}。'
    )


# ---------------------------------------------------------------------------
# 调试用
# ---------------------------------------------------------------------------
def debug_dump_models() -> dict[str, bool]:
    """返回 market.models 各关键类的可用性，便于健康检查接口。"""
    return {
        'Product': _PRODUCT_MODEL is not None,
        'Order': _ORDER_MODEL is not None,
        'Category': _CATEGORY_MODEL is not None,
    }


def reload_models() -> None:
    """开发期在 models 变更后重新探测。"""
    global _PRODUCT_MODEL, _ORDER_MODEL, _CATEGORY_MODEL
    _PRODUCT_MODEL, _ORDER_MODEL, _CATEGORY_MODEL = _try_import_models()
