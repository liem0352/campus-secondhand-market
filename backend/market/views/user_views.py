"""
market.views.user_views
========================

用户资料相关视图：
- :class:`MeView`             GET/PATCH /api/users/me/      当前用户资料
- :class:`MyStatsView`        GET  /api/users/me/stats/    个人统计
- :class:`AvatarUploadView`   POST /api/users/me/avatar/   头像上传（multipart）
- :class:`VerifyView`         POST /api/users/me/verify/   校园认证
- :class:`ChangePasswordView` POST /api/users/me/change-password/ 改密
"""
import os
import uuid

from django.conf import settings
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from market.exceptions import ValidationException
from market.models import Favorite, Order, Product, Review
from market.permissions import IsAdminUser
from market.response import created, ok
from market.serializers.user_serializers import (
    ChangePasswordSerializer,
    UserSerializer,
    UserUpdateSerializer,
    VerifySerializer,
)


# ---------------------------------------------------------------------------
# 当前用户
# ---------------------------------------------------------------------------
class MeView(APIView):
    """当前登录用户资料读写。

    GET    /api/users/me/        读取完整资料
    PATCH  /api/users/me/        更新部分资料
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """返回当前用户的完整资料。"""
        return ok(UserSerializer(request.user).data)

    def patch(self, request):
        """更新当前用户的部分资料（不允许改 role / credit / is_certified）。"""
        ser = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        ser.save()
        return ok(UserSerializer(request.user).data)


# ---------------------------------------------------------------------------
# 个人统计
# ---------------------------------------------------------------------------
class MyStatsView(APIView):
    """个人统计接口。

    GET /api/users/me/stats/
    返回：
        ``{on_sale, sold, favorites, reviews, orders_as_buyer, orders_as_seller}``
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """聚合统计当前用户的核心数据。"""
        user = request.user
        return ok({
            'on_sale': Product.objects.filter(seller=user, status='on_sale').count(),
            'sold': Product.objects.filter(seller=user, status='sold').count(),
            'favorites': Favorite.objects.filter(user=user).count(),
            'reviews': Review.objects.filter(reviewee=user).count(),
            'orders_as_buyer': Order.objects.filter(buyer=user).count(),
            'orders_as_seller': Order.objects.filter(seller=user).count(),
        })


# ---------------------------------------------------------------------------
# 头像上传
# ---------------------------------------------------------------------------
class AvatarUploadView(APIView):
    """头像上传接口。

    POST /api/users/me/avatar/   multipart/form-data, field: file
    返回：``{url: 'http://.../media/uploads/.../xxx.jpg'}``
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """保存上传头像到 MEDIA_ROOT，并更新 user.avatar 字段。"""
        f = request.FILES.get('file') or request.FILES.get('avatar')
        if not f:
            return Response({'code': 40001, 'message': '未上传文件', 'data': None}, status=400)

        # 校验扩展名
        ext = os.path.splitext(f.name)[1].lower().lstrip('.')
        if ext not in settings.ALLOWED_IMAGE_EXTS:
            return Response(
                {'code': 40001, 'message': f'不支持的文件类型 .{ext}', 'data': None},
                status=400,
            )

        # 写入 media/uploads/{yyyy}/{mm}/{uuid}.{ext}
        now = timezone.now()
        rel_dir = f'uploads/{now.year}/{now.month:02d}/avatars'
        abs_dir = os.path.join(settings.MEDIA_ROOT, rel_dir)
        os.makedirs(abs_dir, exist_ok=True)
        name = f'{uuid.uuid4().hex}.{ext}'
        abs_path = os.path.join(abs_dir, name)
        with open(abs_path, 'wb') as out:
            for chunk in f.chunks():
                out.write(chunk)

        url = f'{settings.MEDIA_URL}{rel_dir}/{name}'
        full_url = request.build_absolute_uri(url)
        request.user.avatar = full_url
        request.user.save(update_fields=['avatar', 'updated_at'])
        return ok({'url': full_url})


# ---------------------------------------------------------------------------
# 校园认证
# ---------------------------------------------------------------------------
class VerifyView(APIView):
    """校园身份认证接口。

    POST /api/users/me/verify/   {student_id, school?}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """提交学号完成校园认证（demo 模式直接置 True）。"""
        ser = VerifySerializer(data=request.data)
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        user = request.user
        user.student_id = ser.validated_data['student_id']
        if ser.validated_data.get('school'):
            user.school = ser.validated_data['school']
        user.is_certified = True
        user.save(update_fields=['student_id', 'school', 'is_certified', 'updated_at'])
        return ok({'is_certified': True, 'credit_score': user.credit_score})


# ---------------------------------------------------------------------------
# 修改密码
# ---------------------------------------------------------------------------
class ChangePasswordView(APIView):
    """修改密码接口。

    POST /api/users/me/change-password/   {old_password, new_password}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """校验旧密码并写入新密码。"""
        ser = ChangePasswordSerializer(data=request.data)
        if not ser.is_valid():
            raise ValidationException(str(ser.errors))
        user = request.user
        if not user.check_password(ser.validated_data['old_password']):
            return Response(
                {'code': 40001, 'message': '原密码错误', 'data': None}, status=400,
            )
        user.set_password(ser.validated_data['new_password'])
        user.save(update_fields=['password'])
        return ok(None, '密码已更新')
