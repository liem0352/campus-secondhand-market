"""
market.urls
===========

校园二手交易平台全部 API 路由汇总。

由 ``config.urls`` 通过 ``path('api/', include('market.urls'))`` 挂载，
因此本文件内的 ``path`` 都是相对 ``/api/`` 的。
"""
from django.urls import path

from market.views import (
    admin_views,
    ai_views,
    auth_views,
    category_views,
    compat_views,
    message_views,
    order_views,
    product_views,
    report_views,
    stats_views,
    system_views,
    upload_views,
    user_views,
)


urlpatterns = [
    # ==================== 健康检查 ====================
    # 根路由 /api/health/ 已在 config/urls.py 中显式提供；
    # 此处再提供一次兼容旧前端路径，避免 404。
    path('health/', auth_views.HealthCheckView.as_view(), name='health'),

    # ==================== 鉴权 ====================
    path('auth/register/', auth_views.RegisterView.as_view(), name='auth-register'),
    path('auth/login/', auth_views.LoginView.as_view(), name='auth-login'),
    path('auth/logout/', auth_views.LogoutView.as_view(), name='auth-logout'),
    path('auth/refresh/', compat_views.RefreshTokenView.as_view(), name='auth-refresh'),

    # ==================== 用户 ====================
    path('users/me/', user_views.MeView.as_view(), name='user-me'),
    path('users/me/stats/', user_views.MyStatsView.as_view(), name='user-stats'),
    path('users/me/avatar/', user_views.AvatarUploadView.as_view(), name='user-avatar'),
    path('users/me/verify/', user_views.VerifyView.as_view(), name='user-verify'),
    path('users/me/change-password/', user_views.ChangePasswordView.as_view(), name='user-change-pwd'),
    path('users/<int:pk>/', compat_views.UserPublicView.as_view(), name='user-public'),

    # ==================== 分类 ====================
    path('categories/',         category_views.CategoryListView.as_view(), name='category-list'),
    path('categories/tree/',    category_views.CategoryTreeView.as_view(), name='category-tree'),
    # ==================== 商品 ====================
    path('products/', product_views.ProductListCreateView.as_view(), name='product-list'),
    path('products/mine/', product_views.MyProductsView.as_view(), name='product-mine'),
    path('products/suggest/', compat_views.ProductSuggestView.as_view(), name='product-suggest'),
    path('products/upload-image/', compat_views.ProductUploadImageView.as_view(), name='product-upload-image'),
    path('products/bulk-off-shelf/', compat_views.BulkOffShelfView.as_view(), name='product-bulk-off-shelf'),
    path('products/<int:pk>/', product_views.ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:pk>/view/', product_views.ProductViewView.as_view(), name='product-view'),
    path('products/<int:pk>/favorite/', product_views.FavoriteToggleView.as_view(), name='product-favorite'),
    path('products/<int:pk>/off-shelf/', product_views.OffShelfView.as_view(), name='product-off-shelf'),
    path('products/<int:pk>/on-shelf/', product_views.OnShelfView.as_view(), name='product-on-shelf'),
    path('products/<int:pk>/reviews/', compat_views.ProductReviewsView.as_view(), name='product-reviews'),
    path('products/<int:pk>/similar/', compat_views.ProductSimilarView.as_view(), name='product-similar'),
    path('favorites/', product_views.MyFavoritesView.as_view(), name='favorites'),
    # 兼容旧前端：POST /favorites/toggle/
    path('favorites/toggle/', compat_views.LegacyFavoriteToggleView.as_view(), name='favorites-toggle-legacy'),

    # ==================== 会话 / 消息 ====================
    path('conversations/', message_views.ConversationListCreateView.as_view(), name='conversations'),
    path('conversations/<int:pk>/', message_views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:pk>/messages/', message_views.ConversationMessagesView.as_view(), name='conversation-messages'),
    path('conversations/<int:pk>/read/', message_views.MarkReadView.as_view(), name='conversation-read'),
    path('messages/send/', message_views.SendMessageView.as_view(), name='message-send'),

    # ==================== 订单 ====================
    path('orders/', order_views.OrderListCreateView.as_view(), name='orders'),
    path('orders/<int:pk>/', order_views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/confirm/', order_views.ConfirmOrderView.as_view(), name='order-confirm'),
    path('orders/<int:pk>/reject/', order_views.RejectOrderView.as_view(), name='order-reject'),
    path('orders/<int:pk>/cancel/', order_views.CancelOrderView.as_view(), name='order-cancel'),
    path('orders/<int:pk>/complete/', order_views.CompleteOrderView.as_view(), name='order-complete'),
    path('orders/<int:pk>/ship/', order_views.ShipOrderView.as_view(), name='order-ship'),
    path('reviews/', order_views.ReviewCreateView.as_view(), name='review-create'),

    # ==================== 举报 ====================
    path('reports/', report_views.ReportCreateView.as_view(), name='report-create'),
    path('admin/reports/', report_views.ReportListView.as_view(), name='admin-reports'),
    path('admin/reports/count/', report_views.ReportCountView.as_view(), name='admin-reports-count'),

    # ==================== 管理后台 ====================
    path('admin/dashboard/', admin_views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/dashboard/trend/', admin_views.AdminDashboardTrendView.as_view(), name='admin-dashboard-trend'),
    path('admin/dashboard/category-distribution/', admin_views.AdminDashboardCategoryDistView.as_view(), name='admin-dashboard-cat'),
    path('admin/users/', admin_views.UserListManageView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/ban/', admin_views.UserBanView.as_view(), name='admin-user-ban'),
    path('admin/users/<int:pk>/unban/', admin_views.UserUnbanView.as_view(), name='admin-user-unban'),
    path('admin/users/<int:pk>/adjust-credit/', admin_views.UserAdjustCreditView.as_view(), name='admin-user-credit'),
    path('admin/products/audit/', admin_views.ProductAuditListView.as_view(), name='admin-product-audit'),
    path('admin/products/audit/count/', admin_views.ProductAuditCountView.as_view(), name='admin-product-audit-count'),
    path('admin/products/<int:pk>/approve/', admin_views.ProductApproveView.as_view(), name='admin-product-approve'),
    path('admin/products/<int:pk>/reject/', admin_views.ProductRejectView.as_view(), name='admin-product-reject'),
    path('admin/categories/', admin_views.CategoryManageView.as_view(), name='admin-categories'),
    path('admin/categories/<int:pk>/', admin_views.CategoryManageView.as_view(), name='admin-category-detail'),
    path('admin/reports/<int:pk>/handle/', admin_views.ReportHandleView.as_view(), name='admin-report-handle'),
    path('admin/audit-logs/', admin_views.AuditLogListView.as_view(), name='admin-audit-logs'),
    path('admin/ai/config/', admin_views.AdminAiConfigView.as_view(), name='admin-ai-config'),
    path('admin/ai/health/', admin_views.AdminAiHealthView.as_view(), name='admin-ai-health'),

    # ==================== AI ====================
    path('ai/publish-assist/', ai_views.AiPublishAssistView.as_view(), name='ai-publish-assist'),
    path('ai/price-suggest/', ai_views.AiPriceSuggestView.as_view(), name='ai-price-suggest'),
    path('ai/moderate/', ai_views.AiModerateView.as_view(), name='ai-moderate'),
    path('ai/polish/', ai_views.AiPolishView.as_view(), name='ai-polish'),
    path('ai/negotiate/', ai_views.AiNegotiateView.as_view(), name='ai-negotiate'),
    path('ai/extract-keywords/', ai_views.AiExtractKeywordsView.as_view(), name='ai-extract-keywords'),
    path('ai/customer-service/', ai_views.AiCustomerServiceView.as_view(), name='ai-customer-service'),
    path('ai/chat/', ai_views.AiGeneralChatView.as_view(), name='ai-chat'),
    path('ai/health/', ai_views.AiHealthView.as_view(), name='ai-health'),

    # ==================== 卖家统计（前端 Web 卖家台 Dashboard 使用）====================
    path('stats/me/overview/',             compat_views.MeOverviewView.as_view(),             name='stats-me-overview'),
    path('stats/seller/overview/',         stats_views.SellerOverviewView.as_view(),          name='stats-seller-overview'),
    path('stats/seller/trend/',            stats_views.SellerTrendView.as_view(),             name='stats-seller-trend'),
    path('stats/seller/category-distribution/',  stats_views.SellerCategoryDistributionView.as_view(),   name='stats-seller-cat'),
    path('stats/seller/price-range/',      stats_views.SellerPriceRangeView.as_view(),        name='stats-seller-price-range'),

    # ==================== 上传 ====================
    path('upload/', upload_views.ImageUploadView.as_view(), name='upload'),

    # ==================== 系统级（轮播 / 公告 / 热门）====================
    path('banners/',       system_views.banners,       name='sys-banners'),
    path('notices/',       system_views.notices,       name='sys-notices'),
    path('hot-keywords/',  system_views.hot_keywords,  name='sys-hot-keywords'),
    path('site-stats/',    system_views.site_stats,    name='sys-site-stats'),
    path('home-feed/',     system_views.home_feed,     name='sys-home-feed'),
]
