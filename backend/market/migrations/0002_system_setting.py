"""
为 SystemSetting 新增模型 + 扩展 AuditLog.ACTION_CHOICES。
"""
from django.db import migrations, models


class Migration(migrations.Migration):
    """系统设置模型 + 审计日志枚举扩展。"""

    dependencies = [
        ("market", "0001_initial"),
    ]

    operations = [
        # 1) 扩展 AuditLog 操作枚举
        migrations.AlterField(
            model_name="auditlog",
            name="action",
            field=models.CharField(
                choices=[
                    ("approve_product", "通过商品"),
                    ("reject_product", "驳回商品"),
                    ("off_shelf_product", "下架商品"),
                    ("handle_report", "处理举报"),
                    ("ban_user", "封禁用户"),
                    ("unban_user", "解封用户"),
                    ("adjust_credit", "调整信用分"),
                    ("update_ai_config", "更新 AI 配置"),
                    ("create_category", "新建分类"),
                    ("update_category", "更新分类"),
                    ("delete_category", "删除分类"),
                ],
                max_length=32,
                verbose_name="操作",
            ),
        ),
        # 2) 新增 SystemSetting 模型
        migrations.CreateModel(
            name="SystemSetting",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("key", models.CharField(max_length=64, unique=True, verbose_name="配置键")),
                ("value", models.TextField(blank=True, default="", verbose_name="配置值")),
                ("description", models.CharField(blank=True, default="", max_length=255, verbose_name="描述")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="更新时间")),
            ],
            options={
                "verbose_name": "系统配置",
                "verbose_name_plural": "系统配置",
                "db_table": "market_system_setting",
            },
        ),
    ]
