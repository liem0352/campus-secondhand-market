"""通用工具 — 解析当前请求的 finance.User"""


def get_request_user(request):
    """
    从 request 解析 finance.User。
    需在项目中配置 JWT 使 request.user 为 finance.User，
    或实现自定义 Authentication 返回 User 实例。
    """
    from finance.models import User

    u = request.user
    if isinstance(u, User):
        return u
    if hasattr(u, 'finance_user'):
        return u.finance_user
    if getattr(u, 'is_authenticated', False) and getattr(u, 'pk', None):
        try:
            return User.objects.get(pk=u.pk)
        except User.DoesNotExist:
            pass
    # 开发兜底：部分课程 JWT 将 user_id 放在 token payload，需自行扩展
    user_id = getattr(request, 'finance_user_id', None)
    if user_id:
        return User.objects.get(pk=user_id)
    raise PermissionError('未登录或无法识别用户')
