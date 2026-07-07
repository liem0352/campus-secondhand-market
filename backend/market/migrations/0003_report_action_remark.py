"""
为 Report 模型增加 ``action`` 与 ``remark`` 字段，
便于管理后台直接展示处理动作和处理备注。
"""
from django.db import migrations, models


class Migration(migrations.Migration):
    """Report 扩展：写入处理动作与处理备注。"""

    dependencies = [
        ("market", "0002_system_setting"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="action",
            field=models.CharField(
                blank=True,
                default="",
                help_text="warn=警告 / remove=下架 / ban=封禁 / reject=驳回",
                max_length=16,
                verbose_name="处理动作",
            ),
        ),
        migrations.AddField(
            model_name="report",
            name="remark",
            field=models.CharField(
                blank=True,
                default="",
                max_length=128,
                verbose_name="处理备注",
            ),
        ),
    ]
