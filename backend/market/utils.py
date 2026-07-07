"""
通用工具函数 — 解析当前请求对应的 market.User。

保留 finance.utils 的设计原则：
    1) 优先从 request.user 直接取；
    2) 否则按 request.user.pk 反查；
    3) 兜底通过 request 上挂载的 user_id 显式字段读取。
"""
try:
    from market.models import User  # type: ignore
except Exception:  # pragma: no cover - 启动期容错
    User = None  # type: ignore


def get_request_user(request):
    """从 DRF request 解析出当前登录的市场用户。

    参数：
        request (rest_framework.request.Request): DRF 视图接收的请求对象。

    返回：
        market.models.User: 当前登录用户实例。

    异常：
        PermissionError: 任何方式都无法确定用户身份时抛出。
    """
    if User is None:
        raise PermissionError('market.User 尚未注册，请先在 market/models.py 中定义 User')

    u = request.user
    # 1) request.user 本身就是 market.User（最常见）
    if isinstance(u, User):
        return u

    # 2) 通过 market_user 关联属性取
    if hasattr(u, 'market_user'):
        return u.market_user

    # 3) 通过主键反查（兼容某些场景下 user 是其他类但 pk 相同）
    if getattr(u, 'is_authenticated', False) and getattr(u, 'pk', None):
        try:
            return User.objects.get(pk=u.pk)
        except User.DoesNotExist:
            pass

    # 4) 兜底：从 request 自定义字段取（需中间件注入）
    user_id = getattr(request, 'market_user_id', None)
    if user_id:
        return User.objects.get(pk=user_id)

    raise PermissionError('未登录或无法识别用户')
