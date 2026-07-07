"""
Django 根路由 — 校园二手交易平台

- /admin/        : Django 自带 Admin（市场业务后续可挂 market.admin）
- /api/health/   : 健康检查（由 market.views.health 提供）
- /api/          : 校园二手交易业务 API（market.urls）
- /media/...     : 开发环境下用户上传的商品图 / 头像（仅 DEBUG 生效）
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

# 健康检查视图：作为根路由 fallback，避免在 market 业务尚未实现时启动失败
from market.views.health import health_check  # noqa: E402

urlpatterns = [
    # 1) Django Admin
    path('admin/', admin.site.urls),

    # 2) 健康检查（liveness / readiness 探针）
    path('api/health/', health_check, name='health-check'),

    # 3) 校园二手交易业务 API
    #    子路由由 market/urls.py 维护（auth/products/orders/ai/...）
    path('api/', include('market.urls')),
]

# 4) 开发环境下托管用户上传的媒体文件（商品图、头像等）
#    生产环境务必改为对象存储 + Nginx 代理，绝不能让 Django 直接 serve 大文件。
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
