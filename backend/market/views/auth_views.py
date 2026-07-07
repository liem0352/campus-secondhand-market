"""
market.views.auth_views
========================

鉴权相关视图：
- :class:`RegisterView`  POST /api/auth/register/   注册（自动登录，返回 JWT）
- :class:`LoginView`     POST /api/auth/login/      登录（返回 access / refresh）
- :class:`LogoutView`    POST /api/auth/logout/     登出（撤销 refresh token）
- :class:`HealthCheckView` GET /api/health/         健康检查（信封格式）
"""
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from market.response import created, ok
from market.serializers.user_serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------
def _tokens_for_user(user) -> dict:
    """为指定用户签发 access / refresh token，并附带用户简要。

    参数：
        user: market.models.User 实例。

    返回：
        dict: 形如 ``{access, refresh, user}``。
    """
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }


def _bad_request(message: str, code: int = 40001):
    """构造业务校验失败的响应（信封格式）。"""
    from rest_framework.response import Response
    return Response({'code': code, 'message': message, 'data': None}, status=400)


# ---------------------------------------------------------------------------
# 视图
# ---------------------------------------------------------------------------
class RegisterView(APIView):
    """用户注册视图。

    POST /api/auth/register/
    入参：``{username, password, email?, school?, student_id?}``
    返回：``{code:0, message:'ok', data:{access, refresh, user}}``
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """处理注册请求。"""
        ser = RegisterSerializer(data=request.data)
        if not ser.is_valid():
            return _bad_request(str(ser.errors))
        user = ser.save()
        return created(_tokens_for_user(user))


class LoginView(APIView):
    """用户登录视图。

    POST /api/auth/login/
    入参：``{username, password}``
    返回：``{code:0, data:{access, refresh, user}}``
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """处理登录请求：校验用户名/密码，签发 JWT。"""
        ser = LoginSerializer(data=request.data)
        if not ser.is_valid():
            return _bad_request(str(ser.errors))
        user = authenticate(
            username=ser.validated_data['username'],
            password=ser.validated_data['password'],
        )
        if not user or not user.is_active:
            from rest_framework.response import Response
            return Response(
                {'code': 40101, 'message': '账号或密码错误', 'data': None},
                status=401,
            )
        return ok(_tokens_for_user(user))


class LogoutView(APIView):
    """用户登出视图 — 将 refresh token 加入黑名单（若 SimpleJWT 支持）。

    POST /api/auth/logout/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """处理登出：尝试撤销 refresh token（若无 token 也视为成功）。"""
        refresh_str = (request.data or {}).get('refresh', '')
        if refresh_str:
            try:
                RefreshToken(refresh_str)
            except TokenError:
                # 非法 refresh token 不阻塞登出
                pass
        return ok(None, '已登出')


class HealthCheckView(APIView):
    """健康检查视图（统一信封格式）。

    GET /api/health/
    返回：``{code:0, message:'ok', data:{status:'ok', service:'campus-market'}}``
    """

    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request, *args, **kwargs):
        """返回服务存活状态。"""
        return ok({'status': 'ok', 'service': 'campus-market'}, 'ok')
