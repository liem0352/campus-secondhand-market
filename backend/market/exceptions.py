"""
统一业务异常与 DRF 全局异常处理。

原 finance.exceptions 复制而来，差异点：
    1) FinanceException 改名为 MarketException 以贴合新业务；
    2) 错误码段位沿用 4xxxx（业务）+ 5xxxx（外部服务），保持前端兼容；
    3) 全部函数/类添加中文说明。

使用建议：
    - 业务层抛出 MarketException 子类即可，框架层会序列化为 {code,message,data}。
"""
from rest_framework.exceptions import ValidationError


class MarketException(Exception):
    """市场业务通用异常基类。

    参数：
        code (int): 业务错误码（4xxx 表示客户端，5xxx 表示服务端）。
        message (str): 人类可读的错误说明。
        data (dict | list | None): 附加结构化数据，便于前端展示具体错误字段。
    """

    def __init__(self, code: int, message: str, data=None):
        # 业务码：前端按 code 决定弹窗文案 / 跳转行为
        self.code = code
        # 错误描述：默认展示文案，可被 i18n 覆盖
        self.message = message
        # 附加数据：例如表单字段级错误、订单冲突的商品快照
        self.data = data
        super().__init__(message)


class ValidationException(MarketException):
    """参数校验失败（对应 HTTP 400）。"""

    def __init__(self, message: str = '参数错误', data=None):
        super().__init__(40001, message, data)


class PermissionDeniedException(MarketException):
    """权限不足（对应 HTTP 403）。"""

    def __init__(self, message: str = '无权限访问', data=None):
        super().__init__(40301, message, data)


class ResourceNotFoundException(MarketException):
    """资源不存在（对应 HTTP 404）。"""

    def __init__(self, message: str = '资源不存在', data=None):
        super().__init__(40401, message, data)


class RateLimitException(MarketException):
    """触发限流（对应 HTTP 429）。"""

    def __init__(self, message: str = '请求过于频繁，请稍后再试', data=None):
        super().__init__(42901, message, data)


class ExternalServiceException(MarketException):
    """外部服务（如 LLM / 短信）不可用（对应 HTTP 503）。"""

    def __init__(self, message: str = '外部服务不可用', data=None):
        super().__init__(50301, message, data)


def code_to_http_status(code: int) -> int:
    """将业务错误码映射为 HTTP 状态码，便于网关 / 前端统一处理。"""
    if 40001 <= code <= 40099:
        return 400
    if 40101 <= code <= 40199:
        return 401
    if 40301 <= code <= 40399:
        return 403
    if code == 40401:
        return 404
    if code == 42901:
        return 429
    if 50301 <= code <= 50399:
        return 503
    return 500


def custom_exception_handler(exc, context):
    """DRF 全局异常处理入口 — 注册到 REST_FRAMEWORK['EXCEPTION_HANDLER']。

    参数：
        exc (Exception): 视图抛出的异常对象。
        context (dict): DRF 提供的上下文（含 view / request 等）。

    返回：
        rest_framework.response.Response: 统一信封 {code, message, data}。
    """
    from rest_framework.response import Response
    from rest_framework.views import exception_handler

    # 1) 业务自定义异常：直接按 code 映射 HTTP 状态
    if isinstance(exc, MarketException):
        return Response(
            {'code': exc.code, 'message': exc.message, 'data': exc.data},
            status=code_to_http_status(exc.code),
        )

    # 2) DRF 自带的 ValidationError：转成 40001 信封，兼容旧前端
    if isinstance(exc, ValidationError):
        return Response(
            {'code': 40001, 'message': str(exc.detail), 'data': None},
            status=400,
        )

    # 3) DRF 默认处理：处理 401/403/404/405/415 等
    response = exception_handler(exc, context)
    if response is not None:
        return response

    # 4) 兜底：未识别异常 -> 50001，避免泄露堆栈
    return Response(
        {'code': 50001, 'message': '服务器内部错误', 'data': None},
        status=500,
    )
