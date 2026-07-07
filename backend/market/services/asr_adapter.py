"""
market.services.asr_adapter
===========================

语音转文字（ASR）适配器（精简版）。

主要服务于"语音描述商品"功能：用户按住说话 → ASR 转为文字 →
继续走 :func:`ai_service.publish_assist` 的纯文本路径。

实现策略
--------
1. **首选微信同声传译插件**（``WechatSI``）：小程序端侧转写，零延迟、无需后端。
2. **后端兜底**：当小程序插件不可用（例如 Web 卖家台、调试场景）时，
   由后端 ASR 适配器完成转写。

依赖
----
- ``ASR_PROVIDER`` 环境变量：``wechat`` / ``stub`` / ``tencent``
- 可选 ``TENCENT_ASR_SECRET_ID`` / ``TENCENT_ASR_SECRET_KEY``
- 可选 ``ALI_ASR_APP_KEY`` / ``ALI_ASR_ACCESS_TOKEN``（阿里云）
- 建议新增依赖 ``tencentcloud-sdk-python``（生产环境按需安装）
"""

from __future__ import annotations

import logging
import os
from typing import Protocol

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 业务异常
# ---------------------------------------------------------------------------
class AsrException(Exception):
    """ASR 不可用时抛出，视图层捕获后向前端返回明确提示。"""

    def __init__(self, message: str, code: int = 50302):
        self.message = message
        self.code = code
        super().__init__(message)


# ---------------------------------------------------------------------------
# 协议
# ---------------------------------------------------------------------------
class AsrAdapter(Protocol):
    """ASR 适配器协议，所有实现类必须提供 :meth:`transcribe`。"""

    name: str

    def transcribe(
        self,
        audio_bytes: bytes,
        fmt: str = 'mp3',
        lang: str = 'zh-CN',
    ) -> str:
        """
        把音频字节流转写为文字。

        Parameters
        ----------
        audio_bytes : bytes
            原始音频（mp3 / wav / silk / pcm）。
        fmt : str
            音频格式。
        lang : str
            语言，默认 ``zh-CN``。

        Returns
        -------
        str
            转写后的中文文本。
        """
        ...


# ---------------------------------------------------------------------------
# Stub（默认）
# ---------------------------------------------------------------------------
class StubAsrAdapter:
    """占位适配器：未配置云端 ASR 时给出友好提示。"""

    name = 'stub'

    def transcribe(
        self,
        audio_bytes: bytes,
        fmt: str = 'mp3',
        lang: str = 'zh-CN',
    ) -> str:
        raise AsrException(
            '云端 ASR 未配置，建议使用微信「同声传译」插件端侧转写，'
            '或在发布页直接输入文字描述。',
        )


# ---------------------------------------------------------------------------
# 腾讯云 ASR（占位 + 完整骨架）
# ---------------------------------------------------------------------------
class TencentAsrAdapter:
    """
    腾讯云一句话识别占位实现。

    启用方式（生产环境）：
        1. ``pip install tencentcloud-sdk-python``
        2. 在 .env 中配置：
            ASR_PROVIDER=tencent
            TENCENT_ASR_SECRET_ID=xxx
            TENCENT_ASR_SECRET_KEY=xxx
            TENCENT_ASR_REGION=ap-guangzhou
    """

    name = 'tencent'

    def __init__(
        self,
        secret_id: str = '',
        secret_key: str = '',
        region: str = 'ap-guangzhou',
    ):
        self.secret_id = secret_id
        self.secret_key = secret_key
        self.region = region

    def transcribe(
        self,
        audio_bytes: bytes,
        fmt: str = 'mp3',
        lang: str = 'zh-CN',
    ) -> str:
        if not self.secret_id or not self.secret_key:
            raise AsrException('腾讯云 ASR 密钥未配置')
        if not audio_bytes:
            raise AsrException('音频字节流为空')
        if len(audio_bytes) > 5 * 1024 * 1024:
            raise AsrException('音频文件不能超过 5MB（一句话识别限制）')

        try:
            # 延迟导入：未安装 SDK 时走 mock
            from tencentcloud.common import credential  # type: ignore
            from tencentcloud.asr.v20190614 import asr_client, models  # type: ignore
        except ImportError:
            logger.warning('tencentcloud-sdk-python 未安装，请 pip install tencentcloud-sdk-python')
            raise AsrException('腾讯云 ASR SDK 未安装')

        try:
            cred = credential.Credential(self.secret_id, self.secret_key)
            client = asr_client.AsrClient(cred, self.region)
            import base64
            req = models.SentenceRecognitionRequest()
            req.EngSerViceType = '16k_zh' if '16k' in fmt else '8k_zh'
            req.SourceType = 1
            req.VoiceFormat = fmt if fmt in ('wav', 'mp3', 'silk', 'pcm', 'm4a') else 'mp3'
            req.UsrAudioKey = f'market-asr-{len(audio_bytes)}'
            req.Data = base64.b64encode(audio_bytes).decode('ascii')
            req.DataLen = len(audio_bytes)

            resp = client.SentenceRecognition(req)
            return getattr(resp, 'Result', '') or ''
        except AsrException:
            raise
        except Exception as exc:
            logger.exception('tencent asr failed: %s', exc)
            raise AsrException(f'腾讯云 ASR 调用失败: {exc}') from exc


# ---------------------------------------------------------------------------
# 阿里云 ASR（占位骨架，便于后续接入）
# ---------------------------------------------------------------------------
class AliyunAsrAdapter:
    """
    阿里云一句话识别占位实现。

    启用方式：
        1. ``pip install aliyun-python-sdk-core aliyun-python-sdk-nls-cloud-meta``
        2. .env 配置：
            ASR_PROVIDER=aliyun
            ALI_ASR_APP_KEY=xxx
            ALI_ASR_ACCESS_TOKEN=xxx
    """

    name = 'aliyun'

    def __init__(self, app_key: str = '', access_token: str = ''):
        self.app_key = app_key
        self.access_token = access_token

    def transcribe(
        self,
        audio_bytes: bytes,
        fmt: str = 'mp3',
        lang: str = 'zh-CN',
    ) -> str:
        if not self.app_key or not self.access_token:
            raise AsrException('阿里云 ASR 凭证未配置')
        if not audio_bytes:
            raise AsrException('音频字节流为空')
        # TODO: 接入阿里云一句话识别 REST API
        logger.info('Aliyun ASR stub: %d bytes fmt=%s', len(audio_bytes), fmt)
        raise AsrException('阿里云 ASR 适配器待实现，请优先使用端侧 WechatSI 插件')


# ---------------------------------------------------------------------------
# 工厂
# ---------------------------------------------------------------------------
def _env(name: str, default: str = '') -> str:
    return (os.environ.get(name) or os.getenv(name) or default).strip()


def get_asr_adapter(provider: str | None = None) -> AsrAdapter:
    """
    根据环境变量或入参获取 ASR 适配器实例。

    Parameters
    ----------
    provider : str, optional
        ``wechat`` / ``stub`` / ``tencent`` / ``aliyun``；
        为空时读取环境变量 ``ASR_PROVIDER``，默认 ``stub``。
    """
    provider = (provider or _env('ASR_PROVIDER', 'stub')).lower()

    if provider in ('wechat', 'wechat_si', 'wechat_plugin', 'stub'):
        # 微信插件转写由小程序端侧完成，后端直接返回 stub 即可
        return StubAsrAdapter()

    if provider in ('tencent', 'tencent_asr'):
        return TencentAsrAdapter(
            secret_id=_env('TENCENT_ASR_SECRET_ID'),
            secret_key=_env('TENCENT_ASR_SECRET_KEY'),
            region=_env('TENCENT_ASR_REGION', 'ap-guangzhou'),
        )

    if provider in ('aliyun', 'aliyun_asr'):
        return AliyunAsrAdapter(
            app_key=_env('ALI_ASR_APP_KEY'),
            access_token=_env('ALI_ASR_ACCESS_TOKEN'),
        )

    logger.warning('未知 ASR_PROVIDER=%s，回落到 stub', provider)
    return StubAsrAdapter()


# ---------------------------------------------------------------------------
# 便捷函数（供视图层直接调用）
# ---------------------------------------------------------------------------
def transcribe_audio(
    audio_bytes: bytes,
    fmt: str = 'mp3',
    lang: str = 'zh-CN',
) -> str:
    """
    便捷转写入口：内部走 ``get_asr_adapter``，失败抛 :class:`AsrException`。
    """
    adapter = get_asr_adapter()
    return adapter.transcribe(audio_bytes, fmt=fmt, lang=lang)
