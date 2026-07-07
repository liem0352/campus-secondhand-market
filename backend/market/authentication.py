"""
JWT 鉴权 — 将 Token 中的 user_id 解析为 market.User 实例。

原 finance.authentication 改造而来，差异点：
    1) User 模型从 finance.models 切换为 market.models；
    2) 增加函数级中文注释；
    3) is_active 校验逻辑保留（被禁用账号无法登录）。
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

# 注：当前 market.models 尚未提供 User 类，先延迟导入避免启动失败。
# 后续 Agent 写入 User 模型后，本行 import 将生效，无需再改动。
try:
    from market.models import User  # type: ignore
except Exception:  # pragma: no cover - 启动期容错
    User = None  # type: ignore


class JWTUserAuthentication(JWTAuthentication):
    """将 JWT user_id 解析为 market.User。"""

    def get_user(self, validated_token):
        """根据 JWT payload 中的 user_id 取出对应用户。

        参数：
            validated_token (dict): 已经过 SimpleJWT 校验合法性的 token 负载。

        返回：
            market.models.User: 找到的、且未禁用的用户实例。

        异常：
            InvalidToken: token 中缺少 user_id 字段，或对应用户不存在 / 已禁用。
        """
        # 1) 从 token 中读取用户主键；缺失则视为非法 token
        try:
            user_id = validated_token['user_id']
        except KeyError as exc:
            raise InvalidToken('Token contained no recognizable user identification') from exc

        # 2) 防御性检查：User 模型尚未注入时给出友好错误
        if User is None:
            raise InvalidToken('market.User 尚未注册，请先在 market/models.py 中定义 User')

        # 3) 查库；is_active=False 一律拒绝，避免被禁用账号继续访问
        try:
            return User.objects.get(pk=user_id, is_active=True)
        except User.DoesNotExist as exc:
            raise InvalidToken('User not found') from exc
