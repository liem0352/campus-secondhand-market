"""market.serializers — DRF 序列化器聚合包。

按业务域拆分到子模块：
- user_serializers
- category_serializers
- product_serializers
- favorite_serializers
- message_serializers
- order_serializers
- report_serializers
- audit_serializers
"""
from market.serializers.audit_serializers import AuditLogSerializer
from market.serializers.category_serializers import CategorySerializer
from market.serializers.favorite_serializers import FavoriteSerializer
from market.serializers.message_serializers import (
    ConversationSerializer,
    MessageSerializer,
    SendMessageSerializer,
)
from market.serializers.order_serializers import (
    OrderCreateSerializer,
    OrderSerializer,
    ReviewCreateSerializer,
    ReviewSerializer,
)
from market.serializers.product_serializers import (
    ProductBriefSerializer,
    ProductCreateSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductUpdateSerializer,
)
from market.serializers.report_serializers import (
    ReportCreateSerializer,
    ReportHandleSerializer,
    ReportSerializer,
)
from market.serializers.user_serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserBriefSerializer,
    UserSerializer,
    UserStatsSerializer,
    UserUpdateSerializer,
    VerifySerializer,
)

__all__ = [
    'AuditLogSerializer',
    'CategorySerializer',
    'ChangePasswordSerializer',
    'ConversationSerializer',
    'FavoriteSerializer',
    'LoginSerializer',
    'MessageSerializer',
    'OrderCreateSerializer',
    'OrderSerializer',
    'ProductBriefSerializer',
    'ProductCreateSerializer',
    'ProductDetailSerializer',
    'ProductImageSerializer',
    'ProductUpdateSerializer',
    'RegisterSerializer',
    'ReportCreateSerializer',
    'ReportHandleSerializer',
    'ReportSerializer',
    'ReviewCreateSerializer',
    'ReviewSerializer',
    'SendMessageSerializer',
    'UserBriefSerializer',
    'UserSerializer',
    'UserStatsSerializer',
    'UserUpdateSerializer',
    'VerifySerializer',
]
