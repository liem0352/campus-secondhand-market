"""
ORM 模型 — 对应 docs/04 数据库设计说明书 v3.0
"""
from django.contrib.auth.hashers import check_password, make_password
from django.db import models

from finance.models_voice import CategoryKeyword, VoiceParseLog  # noqa: F401


class User(models.Model):
    ROLE_ADMIN = 'admin'
    ROLE_MEMBER = 'member'
    ROLE_CHOICES = [(ROLE_ADMIN, '管理员'), (ROLE_MEMBER, '成员')]

    username = models.CharField(max_length=50, unique=True, verbose_name='登录名')
    password = models.CharField(max_length=255, verbose_name='密码哈希')
    nickname = models.CharField(max_length=50, blank=True, default='', verbose_name='昵称')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    avatar_url = models.CharField(max_length=500, blank=True, default='')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    hide_total_amount = models.BooleanField(default=False, verbose_name='隐藏首页总金额')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = '用户'
        verbose_name_plural = verbose_name
        indexes = [models.Index(fields=['role', 'is_active'], name='idx_role_active')]

    def set_password(self, raw: str):
        self.password = make_password(raw)

    def check_password(self, raw: str) -> bool:
        return check_password(raw, self.password)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return self.username


class Category(models.Model):
    TYPE_EXPENSE = 'expense'
    TYPE_INCOME = 'income'
    TYPE_CHOICES = [(TYPE_EXPENSE, '支出'), (TYPE_INCOME, '收入')]

    name = models.CharField(max_length=50, verbose_name='分类名')
    icon = models.CharField(max_length=50, default='💰')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TYPE_EXPENSE)
    sort_order = models.IntegerField(default=0)
    is_system = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name = '分类'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'id']
        indexes = [models.Index(fields=['type', 'sort_order'], name='idx_type_sort')]

    def __str__(self):
        return self.name


class Expense(models.Model):
    SOURCE_MANUAL = 'manual'
    SOURCE_VOICE = 'voice'
    SOURCE_CHOICES = [(SOURCE_MANUAL, '手动'), (SOURCE_VOICE, '语音')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='expenses')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=200, blank=True, default='')
    expense_date = models.DateField(verbose_name='消费日期')
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default=SOURCE_MANUAL)
    voice_log = models.ForeignKey(
        VoiceParseLog,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_expense',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        verbose_name = '账单'
        verbose_name_plural = verbose_name
        ordering = ['-expense_date', '-id']
        indexes = [
            models.Index(fields=['expense_date', 'user'], name='idx_exp_date_user'),
            models.Index(fields=['category', 'expense_date'], name='idx_exp_cat_date'),
        ]

    def __str__(self):
        return f'Expense#{self.id} {self.amount}'


class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.CharField(max_length=7, verbose_name='月份 YYYY-MM')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budgets'
        verbose_name = '预算'
        verbose_name_plural = verbose_name
        unique_together = [['user', 'category', 'month']]

    def __str__(self):
        return f'Budget {self.user_id} {self.month}'


class AiChatHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_chats')
    chat_type = models.CharField(max_length=20, default='chat')
    question = models.TextField()
    answer = models.TextField()
    tokens_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_chat_history'
        verbose_name = 'AI对话'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']


class SystemConfig(models.Model):
    config_key = models.CharField(max_length=100, unique=True)
    config_value = models.TextField(blank=True, default='')
    value_type = models.CharField(max_length=20, default='string')
    description = models.CharField(max_length=200, blank=True, default='')
    is_secret = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_config'
        verbose_name = '系统配置'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.config_key
