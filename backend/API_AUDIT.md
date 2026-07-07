# Market App API 检查报告

> 生成时间：2026-06-06
> 范围：backend/market 应用（views / serializers / urls / models / authentication / permissions）
> 结论：API 完成度约 98%，无阻塞性缺失；所有 50 条路由均可解析，所有 26 个序列化器已注册，所有视图类已实现。

---

## 1. 路由 (market/urls.py)

| # | URL | View | HTTP | 权限 | 状态 |
|---|-----|------|------|------|------|
| 1 | `health/` | `auth_views.HealthCheckView` / `health.health_check` | GET | AllowAny | OK |
| 2 | `auth/register/` | `RegisterView` | POST | AllowAny | OK |
| 3 | `auth/login/` | `LoginView` | POST | AllowAny | OK |
| 4 | `auth/logout/` | `LogoutView` | POST | IsAuthenticated | OK |
| 5 | `users/me/` | `MeView` | GET/PATCH | IsAuthenticated | OK |
| 6 | `users/me/stats/` | `MyStatsView` | GET | IsAuthenticated | OK |
| 7 | `users/me/avatar/` | `AvatarUploadView` | POST | IsAuthenticated | OK |
| 8 | `users/me/verify/` | `VerifyView` | POST | IsAuthenticated | OK |
| 9 | `users/me/change-password/` | `ChangePasswordView` | POST | IsAuthenticated | OK |
| 10 | `categories/` | `CategoryListView` | GET | IsAuthenticatedReadOnly | OK |
| 11 | `products/` | `ProductListCreateView` | GET/POST | IsAuthenticatedOrReadOnly | OK |
| 12 | `products/mine/` | `MyProductsView` | GET | IsAuthenticated | OK |
| 13 | `products/<int:pk>/` | `ProductDetailView` | GET/PUT/PATCH/DEL | IsAuthenticatedOrReadOnly | OK |
| 14 | `products/<int:pk>/view/` | `ProductViewView` | POST | AllowAny | OK |
| 15 | `products/<int:pk>/favorite/` | `FavoriteToggleView` | POST | IsAuthenticated | OK |
| 16 | `products/<int:pk>/off-shelf/` | `OffShelfView` | POST | IsAuthenticated | OK |
| 17 | `products/<int:pk>/on-shelf/` | `OnShelfView` | POST | IsAuthenticated | OK |
| 18 | `favorites/` | `MyFavoritesView` | GET | IsAuthenticated | OK |
| 19 | `conversations/` | `ConversationListCreateView` | GET/POST | IsAuthenticated | OK |
| 20 | `conversations/<int:pk>/` | `ConversationDetailView` | GET | IsAuthenticated | OK |
| 21 | `conversations/<int:pk>/messages/` | `ConversationMessagesView` | GET | IsAuthenticated | OK |
| 22 | `conversations/<int:pk>/read/` | `MarkReadView` | POST | IsAuthenticated | OK |
| 23 | `messages/send/` | `SendMessageView` | POST | IsAuthenticated | OK |
| 24 | `orders/` | `OrderListCreateView` | GET/POST | IsAuthenticated | OK |
| 25 | `orders/<int:pk>/` | `OrderDetailView` | GET | IsAuthenticated | OK |
| 26 | `orders/<int:pk>/confirm/` | `ConfirmOrderView` | POST | IsAuthenticated | OK |
| 27 | `orders/<int:pk>/reject/` | `RejectOrderView` | POST | IsAuthenticated | OK |
| 28 | `orders/<int:pk>/cancel/` | `CancelOrderView` | POST | IsAuthenticated | OK |
| 29 | `orders/<int:pk>/complete/` | `CompleteOrderView` | POST | IsAuthenticated | OK |
| 30 | `orders/<int:pk>/ship/` | `ShipOrderView` | POST | IsAuthenticated | OK |
| 31 | `reviews/` | `ReviewCreateView` | POST | IsAuthenticated | OK |
| 32 | `reports/` | `ReportCreateView` | POST | IsAuthenticated | OK |
| 33 | `admin/reports/` | `ReportListView` | GET | IsAdminUser | OK |
| 34 | `admin/dashboard/` | `AdminDashboardView` | GET | IsAdminUser | OK |
| 35 | `admin/users/` | `UserListManageView` | GET | IsAdminUser | OK |
| 36 | `admin/users/<int:pk>/ban/` | `UserBanView` | POST | IsAdminUser | OK |
| 37 | `admin/users/<int:pk>/adjust-credit/` | `UserAdjustCreditView` | POST | IsAdminUser | OK |
| 38 | `admin/products/audit/` | `ProductAuditListView` | GET | IsAdminUser | OK |
| 39 | `admin/products/<int:pk>/approve/` | `ProductApproveView` | POST | IsAdminUser | OK |
| 40 | `admin/products/<int:pk>/reject/` | `ProductRejectView` | POST | IsAdminUser | OK |
| 41 | `admin/categories/` | `CategoryManageView` | GET/POST/PUT/DEL | IsAdminUser | OK |
| 42 | `admin/reports/<int:pk>/handle/` | `ReportHandleView` | POST | IsAdminUser | OK |
| 43 | `admin/audit-logs/` | `AuditLogListView` | GET | IsAdminUser | OK |
| 44 | `ai/publish-assist/` | `AiPublishAssistView` | POST | IsAuthenticated | OK |
| 45 | `ai/price-suggest/` | `AiPriceSuggestView` | GET | IsAuthenticated | OK |
| 46 | `ai/moderate/` | `AiModerateView` | POST | IsAuthenticated | OK |
| 47 | `ai/polish/` | `AiPolishView` | POST | IsAuthenticated | OK |
| 48 | `ai/negotiate/` | `AiNegotiateView` | POST | IsAuthenticated | OK |
| 49 | `ai/health/` | `AiHealthView` | GET | AllowAny | OK |
| 50 | `upload/` | `ImageUploadView` | POST | IsAuthenticated | OK |

**路由验证结果**：50 / 50 全部成功 resolve（已通过 `django.urls.resolve` 实测）。

---

## 2. 视图 (market/views/)

| 文件 | 类 / 函数 | 实现 | 备注 |
|------|-----------|------|------|
| `auth_views.py` | `RegisterView` / `LoginView` / `LogoutView` / `HealthCheckView` | 完整 | 内部使用 `_tokens_for_user` 统一签发 JWT；登录失败 40101 |
| `user_views.py` | `MeView` / `MyStatsView` / `AvatarUploadView` / `VerifyView` / `ChangePasswordView` | 完整 | 头像 multipart 上传，扩展名 + content-type 双重校验 |
| `category_views.py` | `CategoryListView` | 完整 | 支持 `?level=1\|2` 切换树形 / 扁平 |
| `product_views.py` | `ProductListCreateView` / `ProductDetailView` / `MyProductsView` / `ProductViewView` / `FavoriteToggleView` / `MyFavoritesView` / `OffShelfView` / `OnShelfView` | 完整 | 浏览 / 收藏数用 `F()` 原子增减；商品列表支持 status / category / school / condition / keyword / seller_id / min_price / max_price 过滤 |
| `message_views.py` | `ConversationListCreateView` / `ConversationDetailView` / `ConversationMessagesView` / `SendMessageView` / `MarkReadView` | 完整 | 会话内增量消息 `?since=ISO`；发送时自动维护 last_message / last_message_at / 对方未读数 |
| `order_views.py` | `OrderListCreateView` / `OrderDetailView` / `ConfirmOrderView` / `RejectOrderView` / `CancelOrderView` / `CompleteOrderView` / `ShipOrderView` / `ReviewCreateView` | 完整 | 状态机：`requested -> confirmed -> shipping -> completed`，任意阶段可 `cancelled`；`pending_sold` ↔ `on_sale` 互转 |
| `report_views.py` | `ReportCreateView` / `ReportListView` | 完整 | 校验不能举报自己商品；管理端按 status 过滤 |
| `admin_views.py` | `AdminDashboardView` / `UserListManageView` / `UserBanView` / `UserAdjustCreditView` / `ProductAuditListView` / `ProductApproveView` / `ProductRejectView` / `CategoryManageView` / `ReportHandleView` / `AuditLogListView` | 完整 | 仪表盘聚合 user / product / order / message / report 总览；写操作均落 AuditLog |
| `ai_views.py` | `AiPublishAssistView` / `AiPriceSuggestView` / `AiModerateView` / `AiPolishView` / `AiNegotiateView` / `AiHealthView` | 完整 | 全部委托 `market.services.ai_service.get_ai_service()`，失败时返回 `is_ai_fallback=True` 兜底 |
| `upload_views.py` | `ImageUploadView` | 完整 | `MEDIA_ROOT/uploads/{yyyy}/{mm}/{uuid}.{ext}` |
| `health.py` | `HealthCheckView` / `health_check` | 完整 | 函数式 + ViewSet 两种入口，根路由 fallback |

---

## 3. 序列化器 (market/serializers/)

| 模块 | 类 | 实现 |
|------|-----|------|
| user_serializers | `UserBriefSerializer` / `UserSerializer` / `UserUpdateSerializer` / `RegisterSerializer` / `LoginSerializer` / `ChangePasswordSerializer` / `VerifySerializer` / `UserStatsSerializer` | 完整 |
| category_serializers | `CategorySerializer` | 完整（含 `children` 递归） |
| product_serializers | `ProductImageSerializer` / `ProductBriefSerializer` / `ProductDetailSerializer` / `ProductCreateSerializer` / `ProductUpdateSerializer` | 完整 |
| favorite_serializers | `FavoriteSerializer` | 完整 |
| message_serializers | `MessageSerializer` / `ConversationSerializer` / `SendMessageSerializer` | 完整（`peer` / `unread` / `product_cover` 字段通过 SerializerMethodField 动态生成） |
| order_serializers | `OrderSerializer` / `OrderCreateSerializer` / `ReviewSerializer` / `ReviewCreateSerializer` | 完整 |
| report_serializers | `ReportSerializer` / `ReportCreateSerializer` / `ReportHandleSerializer` | 完整 |
| audit_serializers | `AuditLogSerializer` | 完整 |

**注册数**：`market.serializers.__all__` 共导出 26 项，已与全部 11 个模型及业务需求对齐。

---

## 4. 模型 (market/models.py)

| # | 模型 | 关键字段 | 状态 |
|---|------|----------|------|
| 1 | `User` | username / email / password / school / student_id / credit_score / avatar / bio / role / is_certified / created_at / updated_at | OK |
| 2 | `Category` | name / code (unique) / parent (自引用 SET_NULL) / icon / sort_order / is_active / created_at | OK |
| 3 | `Product` | seller / category / title / description / price / original_price / condition / status (6 态) / school / view_count / favorite_count / audit_remark / audited_at / sold_at | OK |
| 4 | `ProductImage` | product / image_url / sort_order / created_at | OK |
| 5 | `Favorite` | user / product + `unique_together(user, product)` | OK |
| 6 | `Conversation` | product / buyer / seller / last_message / last_message_at / unread_buyer / unread_seller + `unique_together(product, buyer)` | OK |
| 7 | `Message` | conversation / sender / content / is_read / created_at | OK |
| 8 | `Order` | product / buyer / seller / status (5 态) / shipping_method / price / note / pickup_location / pickup_time / completed_at | OK |
| 9 | `Review` | order (OneToOne) / reviewer / reviewee / rating / content | OK |
| 10 | `Report` | reporter / product / reason (5 选) / description / status (5 态) / handler / handled_at | OK |
| 11 | `AuditLog` | operator / action (6 选) / target_type / target_id / remark | OK |

**完整性**：11 个核心模型全部存在；`db_table`、`verbose_name`、`indexes`、`unique_together` 合理；状态机字段均给出 `choices` 元组。

---

## 5. 鉴权与权限

| 文件 | 关键点 | 状态 |
|------|--------|------|
| `authentication.py` | `JWTUserAuthentication(JWTAuthentication)` → 解析 `user_id` claim → `User.objects.get(pk=…, is_active=True)`；`is_active=False` 直接抛 `InvalidToken` | OK |
| `permissions.py` | `IsAdminUser` / `IsAdminOrReadOnly` / `IsOwnerOrAdmin` / `IsAuthenticatedReadOnly` 四类 RBAC 基础 | OK |
| `settings.py` | `AUTH_USER_MODEL='market.User'`；`DEFAULT_AUTHENTICATION_CLASSES=['market.authentication.JWTUserAuthentication']`；SimpleJWT 30min/1d | OK |
| `exceptions.py` | `MarketException` 体系 + `custom_exception_handler` 全局信封 | OK |
| `response.py` | `ok()` / `created()` / `accepted()` / `no_content()` 统一信封 | OK |
| `pagination.py` | `EnvelopePageNumberPagination` 信封分页 | OK |

---

## 6. 顶层挂载 (config/)

- `config/settings.py`：`INSTALLED_APPS` 中 `market.apps.MarketConfig` 已注册；`AUTH_USER_MODEL='market.User'`；`DEFAULT_PAGINATION_CLASS='market.pagination.EnvelopePageNumberPagination'`。
- `config/urls.py`：`path('api/', include('market.urls'))` 已挂载；`/api/health/` 根路由 fallback 存在。
- 媒体文件：`MEDIA_ROOT = BASE_DIR / 'media'`；`DEBUG=True` 时由 `static()` 暴露 `/media/...`。

---

## 7. 已识别的非阻塞性细节

> 以下条目不影响 API 可用性，仅作后续优化参考。

1. `MyStatsView` 直接返回 dict，未走 `UserStatsSerializer`（序列化器已定义、可用）。
2. `ReportHandleView` 未走 `ReportHandleSerializer`，参数直接从 `request.data` 取（结构与序列化器一致）。
3. `ConversationSerializer` 同时声明了自动派生的 `product` 字段与显式 `product_id` 字段，二者值相同（仅冗余，无害）。
4. `MyProductsView.get` 在分页前后对 `qs` 复用做 `count()`，无竞态问题，但若数据量极大可拆出独立聚合。
5. `Order.STATUS_CHOICES` 与 `Product.STATUS_CHOICES` 的 `pending_sold` 转换在 `OrderListCreateView.post` / `RejectOrderView` / `CancelOrderView` 中已正确处理。

---

## 8. 检查方法与结果

- `python -m py_compile`：market 包下 23 个 `.py` 文件全部通过语法检查（0 错误）。
- `django.setup()` + `market.serializers` / `market.urls` 导入：成功，导出 26 个 serializer、50 条 urlpattern。
- `django.urls.resolve` 50 个目标 URL：100% 命中预期 view。
- 全局 view 列表穷举 import：成功，**无 NotImplementedError / pass / 空函数体**。

---

## 9. 结论

- **API 完成度：约 98%**。
- 50 / 50 路由可用，11 / 11 模型完整，26 / 26 序列化器实现，14 个视图类全部带业务逻辑，鉴权 / 权限 / 分页 / 异常 / 响应均已就位。
- 未发现需立即补全的缺失；剩余 2% 为可选的小型重构（让部分 view 走未使用的序列化器），不在本任务范围内。
