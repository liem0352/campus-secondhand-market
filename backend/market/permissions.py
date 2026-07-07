"""
权限类 — 校园二手交易平台 RBAC 基础。

角色约定（与 spec 一致）：
    - admin：平台管理员，可访问后台、审核商品、处理举报。
    - user：  普通用户（学生），可发布 / 浏览 / 私聊 / 评价。

注：原 finance.permissions 中的 IsExpenseOwnerOrAdmin
    替换为 IsOwnerOrAdmin，泛化为任意资源的拥有者校验。
"""
from rest_framework.permissions import SAFE_METHODS, BasePermission

try:
    from market.models import User  # type: ignore
except Exception:  # pragma: no cover - 启动期容错
    User = None  # type: ignore


def _is_admin(user) -> bool:
    """判断 user 是否具备管理员角色。

    参数：
        user: 已通过认证的用户对象（可能是 market.User 或 AnonymousUser）。

    返回：
        bool: True 表示是管理员。
    """
    return bool(user and getattr(user, 'role', None) == 'admin')


class IsAdminUser(BasePermission):
    """仅允许管理员访问。"""

    def has_permission(self, request, view) -> bool:
        """DRF 入口：检查当前请求用户是否管理员。"""
        return _is_admin(request.user)


class IsAdminOrReadOnly(BasePermission):
    """读操作：任意已登录用户；写操作：仅管理员。"""

    def has_permission(self, request, view) -> bool:
        """DRF 入口：GET/HEAD/OPTIONS 放行已登录用户，其余要求管理员。"""
        if request.method in SAFE_METHODS:
            return bool(request.user and getattr(request.user, 'is_authenticated', False))
        return _is_admin(request.user)


class IsOwnerOrAdmin(BasePermission):
    """对象级权限：仅资源 owner 或管理员可写。

    配合 has_object_permission 使用；view 中需显式调用 self.check_object_permissions。
    """

    def has_object_permission(self, request, view, obj) -> bool:
        """DRF 对象级入口：判断当前用户对 obj 是否有写权限。"""
        if _is_admin(request.user):
            return True
        # 约定 obj.user_id 字段存在；若无则退回 obj.id == user.id 的情形
        owner_id = getattr(obj, 'user_id', None) or getattr(obj, 'id', None)
        return owner_id == getattr(request.user, 'id', None)


class IsAuthenticatedReadOnly(BasePermission):
    """只读不要求登录；写操作必须登录。"""

    def has_permission(self, request, view) -> bool:
        """DRF 入口：读操作放行，写操作要求已登录。"""
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and getattr(request.user, 'is_authenticated', False))
