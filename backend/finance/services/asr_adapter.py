"""
ASR 适配器 — P1 云端转写兜底（插件失败时 /voice/transcribe/）
"""
from __future__ import annotations

import logging
from typing import Protocol

from django.conf import settings

from finance.exceptions import ExternalServiceException

logger = logging.getLogger(__name__)


class AsrAdapter(Protocol):
    def transcribe(self, audio_bytes: bytes, fmt: str = 'mp3', lang: str = 'zh-CN') -> str: ...


class StubAsrAdapter:
    """占位：教学环境未配置云端 ASR 时提示手动输入"""

    def transcribe(self, audio_bytes: bytes, fmt: str = 'mp3', lang: str = 'zh-CN') -> str:
        raise ExternalServiceException(
            '云端 ASR 未配置，请使用微信同声传译插件或在记账页手动输入文字'
        )


class TencentAsrAdapter:
    """
    腾讯云 ASR 占位实现。
    生产环境在此接入官方 SDK / HTTP API，密钥仅存 settings.ASR_*。
    """

    def __init__(self, secret_id: str, secret_key: str, region: str = 'ap-guangzhou'):
        self.secret_id = secret_id
        self.secret_key = secret_key
        self.region = region

    def transcribe(self, audio_bytes: bytes, fmt: str = 'mp3', lang: str = 'zh-CN') -> str:
        if not self.secret_id:
            raise ExternalServiceException('腾讯云 ASR 密钥未配置')
        # TODO: 接入腾讯云一句话识别 / 实时识别 API
        logger.info('Tencent ASR stub: %d bytes fmt=%s', len(audio_bytes), fmt)
        raise ExternalServiceException('腾讯云 ASR 适配器待实现，请优先使用端侧 WechatSI 插件')


def get_asr_adapter(provider: str | None = None) -> AsrAdapter:
    provider = provider or getattr(settings, 'ASR_PROVIDER', 'stub')
    if provider in ('wechat_si', 'wechat_plugin', 'stub'):
        return StubAsrAdapter()
    if provider in ('tencent', 'tencent_asr'):
        return TencentAsrAdapter(
            secret_id=getattr(settings, 'ASR_SECRET_ID', ''),
            secret_key=getattr(settings, 'ASR_SECRET_KEY', ''),
        )
    return StubAsrAdapter()
