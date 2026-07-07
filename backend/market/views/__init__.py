"""market.views — DRF 视图聚合包。

按业务域拆分子模块：
- auth_views        注册 / 登录 / 登出 / 健康检查
- user_views        个人资料 / 统计 / 头像 / 认证 / 改密
- category_views    分类列表
- product_views     商品 CRUD / 收藏 / 浏览 / 上下架
- message_views     会话 / 消息
- order_views       订单 / 状态机 / 评价
- report_views      举报
- admin_views       平台管理后台
- ai_views          AI 一键发布 / 议价 / 审核 / 健康
- upload_views      通用文件上传
- health            健康检查（函数式 + ViewSet 两种入口，保留兼容）
"""
