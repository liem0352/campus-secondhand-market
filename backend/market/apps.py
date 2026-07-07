"""
market App 配置 — 校园二手交易平台核心业务

该 App 替代原有的 finance 业务层，承担：
- 用户与信用分（market.models.User）
- 商品 / 分类 / 收藏 / 私聊 / 订单 / 评价 / 举报 / 审核日志
- AI 一键发布、议价辅助、内容审核（market.services）
"""
from django.apps import AppConfig


class MarketConfig(AppConfig):
    """校园二手交易 App 的 Django 配置类。

    函数功能：
        - 设置默认主键类型为 BigAutoField；
        - 注册 App 名为 market；
        - 中文 verbose_name 方便 Admin 后台识别。
    """

    # 默认主键类型，避免 MySQL 下 int 自增溢出
    default_auto_field = 'django.db.models.BigAutoField'
    # App 标识，须与 settings.INSTALLED_APPS 中的注册名一致
    name = 'market'
    # 在 Django Admin 与日志中显示的中文名
    verbose_name = '校园二手交易'
