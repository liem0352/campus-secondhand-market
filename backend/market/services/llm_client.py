"""
market.services.llm_client
===========================

OpenAI 兼容协议的 LLM（大语言模型）HTTP 客户端。

特性
----
- 支持多模态：可传入图片（HTTP URL / 本地路径 / 字节流） + 文本
- 支持同步调用与流式（SSE）调用
- 配置缺失或网络异常时**明确返回降级标识** ``is_fallback=True``，
  前端据此展示灰色「AI 推荐」标签以区分真伪
- 错误自动重试：最多 ``LLM_MAX_RETRIES`` 次（默认 2），指数退避
- 配置全部从环境变量读取：
    LLM_API_KEY / LLM_BASE_URL / LLM_MODEL / LLM_TIMEOUT
- 提供 ``parse_json_from_content``：自动剥离 markdown 代码块并解析 JSON
- 完整中文函数级注释

依赖
----
- httpx（已在 requirements.txt 中）

示例
----
>>> from market.services.llm_client import get_llm_client
>>> client = get_llm_client()
>>> text, tokens = client.chat([{'role': 'user', 'content': '你好'}])
"""

from __future__ import annotations

import base64
import json
import logging
import os
import re
import time
from dataclasses import dataclass
from typing import Any, Generator, Iterable, Optional

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 单例
# ---------------------------------------------------------------------------
_llm_singleton: Optional['LlmClient'] = None


# ---------------------------------------------------------------------------
# 业务异常（不依赖 finance 包，便于 market 独立运行）
# ---------------------------------------------------------------------------
class LlmException(Exception):
    """LLM 调用相关异常的基类，视图层可捕获后统一返回 503。"""

    def __init__(self, message: str, code: int = 50301, data: dict | None = None):
        self.message = message
        self.code = code
        self.data = data or {}
        super().__init__(message)


# ---------------------------------------------------------------------------
# 配置读取
# ---------------------------------------------------------------------------
def _env(name: str, default: str = '') -> str:
    """读取环境变量，统一 strip。"""
    return (os.environ.get(name) or os.getenv(name) or default).strip()


def _env_int(name: str, default: int) -> int:
    """读取整型环境变量，失败时回落到 default。"""
    raw = os.environ.get(name) or os.getenv(name)
    try:
        return int(raw) if raw else default
    except (TypeError, ValueError):
        return default


def _env_float(name: str, default: float) -> float:
    """读取浮点型环境变量，失败时回落到 default。"""
    raw = os.environ.get(name) or os.getenv(name)
    try:
        return float(raw) if raw else default
    except (TypeError, ValueError):
        return default


def get_llm_config() -> dict[str, Any]:
    """从环境变量组装 LLM 配置字典，供测试 / 日志使用。"""
    return {
        'api_key': _env('LLM_API_KEY', ''),
        # 兼容两套环境变量名：LLM_BASE_URL（项目内） / LLM_API_BASE（与 settings.py / .env 对齐）
        'base_url': _env('LLM_BASE_URL', '') or _env('LLM_API_BASE', 'https://apihub.agnes-ai.com/v1'),
        'model': _env('LLM_MODEL', 'agnes-2.0-flash'),
        'timeout': _env_int('LLM_TIMEOUT', 30),
        'max_retries': _env_int('LLM_MAX_RETRIES', 2),
        'retry_backoff': _env_float('LLM_RETRY_BACKOFF', 0.6),
    }


# ---------------------------------------------------------------------------
# 响应数据结构
# ---------------------------------------------------------------------------
@dataclass
class LlmResponse:
    """LLM 调用结果封装。"""

    content: str
    tokens_used: int = 0
    is_fallback: bool = False
    raw: dict | None = None

    def to_dict(self) -> dict[str, Any]:
        """转为字典，便于上层 JSON 序列化。"""
        return {
            'content': self.content,
            'tokens_used': self.tokens_used,
            'is_fallback': self.is_fallback,
        }


# ---------------------------------------------------------------------------
# 客户端
# ---------------------------------------------------------------------------
class LlmClient:
    """
    LLM 客户端，封装多模态、JSON 解析、降级 mock、重试。

    Parameters
    ----------
    api_key : str
        API Key；空值或占位值（``your-xxx``）会被视为未配置。
    base_url : str
        OpenAI 兼容服务的基础 URL，默认 ``https://apihub.agnes-ai.com/v1``。
    model : str
        模型名，默认 ``agnes-2.0-flash``。
    timeout : int
        单次 HTTP 超时秒数。
    max_retries : int
        失败重试次数（不含首次）。
    retry_backoff : float
        退避基数（秒），实际退避 = base * 2 ** retry_index。
    """

    PLACEHOLDER_KEYS = ('your-', 'placeholder', 'replace-me', 'changeme')

    def __init__(
        self,
        api_key: str = '',
        base_url: str = 'https://apihub.agnes-ai.com/v1',
        model: str = 'agnes-2.0-flash',
        timeout: int = 30,
        max_retries: int = 2,
        retry_backoff: float = 0.6,
    ):
        self.api_key = (api_key or '').strip()
        self.base_url = (base_url or '').rstrip('/')
        self.model = model or 'agnes-2.0-flash'
        self.timeout = timeout
        self.max_retries = max(0, int(max_retries))
        self.retry_backoff = float(retry_backoff)

    # ------------------------------------------------------------------ 属性
    @property
    def is_configured(self) -> bool:
        """是否已配置真实可用的 API Key（不为空、不是占位符）。"""
        if not self.api_key:
            return False
        lowered = self.api_key.lower()
        return not any(lowered.startswith(p) for p in self.PLACEHOLDER_KEYS)

    # ------------------------------------------------------------------ 同步
    def chat(
        self,
        messages: list[dict],
        temperature: float = 0.3,
        max_tokens: int = 512,
    ) -> tuple[str, int]:
        """
        同步调用 Chat Completions。

        Parameters
        ----------
        messages : list[dict]
            OpenAI 风格消息列表；若要传入图片可使用
            ``content=[{"type": "text", ...}, {"type": "image_url", ...}]``。
        temperature : float
            采样温度。
        max_tokens : int
            最大返回 token。

        Returns
        -------
        tuple[str, int]
            ``(content, tokens_used)``。

        Raises
        ------
        LlmException
            当 LLM 未配置时不会抛错（由调用方决定是否走 mock），
            当重试耗尽仍失败时抛出。
        """
        if not self.is_configured:
            raise LlmException('LLM API Key 未配置', code=50301)

        url = f'{self.base_url}/chat/completions'
        payload = {
            'model': self.model,
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens,
            'stream': False,
        }
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

        last_err: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    resp = client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                content = data['choices'][0]['message']['content']
                tokens = int((data.get('usage') or {}).get('total_tokens') or 0)
                return content, tokens
            except httpx.TimeoutException as exc:
                last_err = exc
                logger.warning('LLM timeout (attempt %s): %s', attempt + 1, exc)
            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code if exc.response is not None else 0
                # 4xx（除 429）属于客户端错误，不应重试
                if 400 <= status < 500 and status != 429:
                    raise LlmException(
                        f'LLM 客户端错误 HTTP {status}: {exc.response.text[:200]}',
                        code=50301,
                    ) from exc
                last_err = exc
                logger.warning('LLM http %s (attempt %s): %s', status, attempt + 1, exc)
            except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
                last_err = exc
                logger.warning('LLM call error (attempt %s): %s', attempt + 1, exc)

            # 退避
            if attempt < self.max_retries:
                wait = self.retry_backoff * (2 ** attempt)
                time.sleep(wait)

        raise LlmException(
            f'AI 服务暂时不可用（重试 {self.max_retries + 1} 次后仍失败）',
            code=50301,
            data={'cause': str(last_err)[:200]} if last_err else None,
        )

    # ------------------------------------------------------------------ 流式
    def chat_stream(
        self,
        messages: list[dict],
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> Generator[str, None, None]:
        """
        流式调用（SSE），逐段 ``yield`` 文本片段。

        未配置 API Key 时不抛错，而是 ``yield`` 出一段固定 mock 文本后结束，
        以保持消费方代码路径一致。

        Raises
        ------
        LlmException
            失败重试耗尽时抛出。
        """
        if not self.is_configured:
            # 降级：返回单段 mock 文本
            yield '【演示模式】未配置 LLM_API_KEY，无法进行流式生成。'
            return

        url = f'{self.base_url}/chat/completions'
        payload = {
            'model': self.model,
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens,
            'stream': True,
        }
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

        last_err: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    with client.stream('POST', url, headers=headers, json=payload) as resp:
                        resp.raise_for_status()
                        for line in resp.iter_lines():
                            if not line:
                                continue
                            if line.startswith('data:'):
                                chunk = line[5:].strip()
                                if chunk == '[DONE]':
                                    return
                                try:
                                    obj = json.loads(chunk)
                                    delta = (
                                        obj.get('choices', [{}])[0]
                                        .get('delta', {})
                                        .get('content')
                                    )
                                except (ValueError, KeyError, IndexError):
                                    delta = None
                                if delta:
                                    yield delta
                return
            except httpx.TimeoutException as exc:
                last_err = exc
                logger.warning('LLM stream timeout (attempt %s)', attempt + 1)
            except httpx.HTTPError as exc:
                last_err = exc
                logger.warning('LLM stream http error (attempt %s): %s', attempt + 1, exc)
            if attempt < self.max_retries:
                wait = self.retry_backoff * (2 ** attempt)
                time.sleep(wait)
        raise LlmException(
            f'AI 流式服务暂时不可用：{last_err}',
            code=50301,
        )

    # ------------------------------------------------------------------ 解析
    def parse_json_from_content(self, content: str) -> dict:
        """
        从模型回复中提取 JSON 对象。

        处理以下情况：
        - ``\\`\\`\\`json ... \\`\\`\\`` 包裹
        - 文本前后多余说明
        - 单层 ``{ ... }`` 片段

        Raises
        ------
        LlmException
            解析失败时抛出。
        """
        if not content:
            raise LlmException('AI 返回内容为空', code=50301)
        text = content.strip()

        # 1) 去掉 markdown 代码块
        if '```' in text:
            m = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
            if m:
                text = m.group(1).strip()

        # 2) 尝试直接解析
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # 3) 抓取首个平衡 { ... }
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                pass

        raise LlmException('AI 返回的 JSON 无法解析', code=50301, data={'raw': content[:200]})


# ---------------------------------------------------------------------------
# 工厂 / 重置
# ---------------------------------------------------------------------------
def get_llm_client() -> LlmClient:
    """获取 LLM 客户端单例（首次调用时根据环境变量创建）。"""
    global _llm_singleton
    if _llm_singleton is None:
        cfg = get_llm_config()
        _llm_singleton = LlmClient(
            api_key=cfg['api_key'],
            base_url=cfg['base_url'],
            model=cfg['model'],
            timeout=cfg['timeout'],
            max_retries=cfg['max_retries'],
            retry_backoff=cfg['retry_backoff'],
        )
    return _llm_singleton


def reset_llm_client() -> None:
    """清除单例（管理端修改 .env 后调用）。"""
    global _llm_singleton
    _llm_singleton = None


# ---------------------------------------------------------------------------
# 多模态辅助函数
# ---------------------------------------------------------------------------
def build_multimodal_user_content(
    text: str,
    image_url: str | None = None,
    image_b64: str | None = None,
    image_mime: str = 'image/jpeg',
) -> list[dict]:
    """
    构造多模态 ``user`` 消息的 ``content`` 列表。

    Parameters
    ----------
    text : str
        文本部分（必填，可为空字符串）。
    image_url : str, optional
        公网可访问的图片 URL。
    image_b64 : str, optional
        base64 编码后的图片二进制（不含 ``data:image/...;base64,`` 前缀）。
    image_mime : str
        图片 MIME 类型，默认 ``image/jpeg``。

    Returns
    -------
    list[dict]
        OpenAI 多模态格式的 content 列表。
    """
    parts: list[dict] = []
    if text:
        parts.append({'type': 'text', 'text': text})
    if image_url:
        parts.append({'type': 'image_url', 'image_url': {'url': image_url}})
    elif image_b64:
        data_uri = f'data:{image_mime};base64,{image_b64}'
        parts.append({'type': 'image_url', 'image_url': {'url': data_uri}})
    if not parts:
        parts.append({'type': 'text', 'text': ''})
    return parts


def encode_image_to_base64(image_bytes: bytes, mime: str = 'image/jpeg') -> str:
    """
    将图片字节流编码为 base64 字符串（不含 ``data:`` 前缀）。

    便于在 LLM 不可访问外网图片时直接以 base64 形式传入。
    """
    if not image_bytes:
        raise LlmException('图片字节流为空', code=40001)
    return base64.b64encode(image_bytes).decode('ascii')


def safe_chat(
    messages: list[dict],
    *,
    temperature: float = 0.3,
    max_tokens: int = 512,
) -> LlmResponse:
    """
    安全调用：未配置 Key 时返回 ``is_fallback=True`` 的 LlmResponse，
    失败时同样降级而非抛错，便于上层统一处理。

    Returns
    -------
    LlmResponse
        ``content`` 为 LLM 原始返回或降级 mock。
    """
    client = get_llm_client()
    if not client.is_configured:
        return LlmResponse(
            content='【演示模式】AI 服务未启用，返回默认结果。',
            tokens_used=0,
            is_fallback=True,
        )
    try:
        content, tokens = client.chat(messages, temperature=temperature, max_tokens=max_tokens)
        return LlmResponse(content=content, tokens_used=tokens, is_fallback=False)
    except LlmException as exc:
        logger.warning('safe_chat fallback: %s', exc.message)
        return LlmResponse(
            content='【演示模式】AI 服务暂时不可用，已降级到本地规则。',
            tokens_used=0,
            is_fallback=True,
            raw={'error': exc.message},
        )


def iter_chat(
    messages: list[dict],
    *,
    temperature: float = 0.3,
    max_tokens: int = 1024,
) -> Iterable[str]:
    """
    便捷流式迭代器。包装 :meth:`LlmClient.chat_stream` 统一异常。
    """
    client = get_llm_client()
    try:
        yield from client.chat_stream(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except LlmException as exc:
        yield f'【演示模式】{exc.message}'
