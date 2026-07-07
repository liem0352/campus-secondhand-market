"""
market.views.upload_views
==========================

文件上传视图。
- :class:`ImageUploadView`   POST /api/upload/   multipart 上传图片
"""
import os
import uuid

from django.conf import settings
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from market.response import ok


class ImageUploadView(APIView):
    """通用图片上传接口 — 返回 ``{url}`` 字段。

    保存到 ``MEDIA_ROOT/uploads/{yyyy}/{mm}/{uuid}.{ext}``，
    URL 形如 ``{MEDIA_URL}uploads/.../xxx.jpg``。

    注：仅做基础扩展名校验；如需更严格校验（尺寸 / 魔数），可在
    此扩展。
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """保存上传文件到 MEDIA_ROOT 并返回公网 URL。"""
        f = request.FILES.get('file')
        if not f:
            return Response(
                {'code': 40001, 'message': '未上传文件', 'data': None}, status=400,
            )

        # 1) 扩展名校验
        ext = os.path.splitext(f.name)[1].lower().lstrip('.')
        if not ext:
            # 部分浏览器不传扩展名，从 content-type 兜底
            ct = (f.content_type or '').lower()
            ext = {
                'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
                'image/webp': 'webp', 'image/gif': 'gif',
            }.get(ct, '')
        if ext not in settings.ALLOWED_IMAGE_EXTS:
            return Response(
                {'code': 40001, 'message': f'不支持的文件类型 .{ext}', 'data': None},
                status=400,
            )

        # 2) 计算保存路径
        now = timezone.now()
        rel_dir = f'uploads/{now.year}/{now.month:02d}'
        abs_dir = os.path.join(settings.MEDIA_ROOT, rel_dir)
        os.makedirs(abs_dir, exist_ok=True)
        name = f'{uuid.uuid4().hex}.{ext}'
        abs_path = os.path.join(abs_dir, name)

        # 3) 写文件
        with open(abs_path, 'wb') as out:
            for chunk in f.chunks():
                out.write(chunk)

        # 4) 构造可访问 URL
        url = f'{settings.MEDIA_URL}{rel_dir}/{name}'
        full_url = request.build_absolute_uri(url)
        return ok({'url': full_url, 'path': f'{rel_dir}/{name}'})
