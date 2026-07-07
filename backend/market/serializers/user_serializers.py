"""
market.serializers.user_serializers
==================================

用户相关序列化器：
- :class:`UserBriefSerializer`  简要用户资料（嵌入会话 / 消息 / 订单）
- :class:`UserSerializer`        完整用户资料（注册后返回、个人主页）
- :class:`RegisterSerializer`    注册入参 + 写入（哈希密码）
- :class:`LoginSerializer`       登录入参校验
- :class:`ChangePasswordSerializer` 改密入参
- :class:`VerifySerializer`      校园认证入参
- :class:`UserStatsSerializer`   个人统计（in / sold / favorite / review）
"""
from rest_framework import serializers

from market.models import User


class UserBriefSerializer(serializers.ModelSerializer):
    """会话 / 消息 / 订单中嵌入的"简要"用户资料。

    字段说明：
        id            用户主键
        username      登录名（前端展示用）
        avatar        头像 URL
        school        学校
        credit_score  信用分
        is_certified  是否已校园认证
    """

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'school', 'credit_score', 'is_certified']


class UserSerializer(serializers.ModelSerializer):
    """完整用户资料 — 用于 ``/users/me/`` 接口。"""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'school', 'student_id',
            'credit_score', 'avatar', 'bio', 'is_certified', 'role',
            'date_joined',
        ]
        read_only_fields = ['id', 'credit_score', 'is_certified', 'role', 'date_joined']


class UserUpdateSerializer(serializers.ModelSerializer):
    """个人资料可更新字段（前端 PATCH /users/me/ 使用）。"""

    class Meta:
        model = User
        fields = ['email', 'school', 'student_id', 'avatar', 'bio']


class RegisterSerializer(serializers.ModelSerializer):
    """用户注册入参。

    字段说明：
        username    登录名（唯一）
        password    明文密码（最少 6 位）
        email       邮箱（可空）
        school      学校
        student_id  学号
    """

    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'school', 'student_id']

    def validate_username(self, value: str) -> str:
        """校验用户名唯一性。"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('用户名已存在')
        return value

    def create(self, validated_data: dict) -> User:
        """创建用户并哈希密码。"""
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        # 默认信用分 80、role 普通用户；is_active 沿用 AbstractUser 默认 True
        user.credit_score = 80
        user.role = 'user'
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """登录入参。"""

    username = serializers.CharField(max_length=64)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})


class ChangePasswordSerializer(serializers.Serializer):
    """修改密码入参。"""

    old_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    new_password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})


class VerifySerializer(serializers.Serializer):
    """校园认证入参。"""

    student_id = serializers.CharField(max_length=32)
    school = serializers.CharField(max_length=64, required=False, allow_blank=True, default='')


class UserStatsSerializer(serializers.Serializer):
    """个人统计（不绑定 Model，便于序列化任意 dict）。"""

    on_sale = serializers.IntegerField(default=0)
    sold = serializers.IntegerField(default=0)
    favorites = serializers.IntegerField(default=0)
    reviews = serializers.IntegerField(default=0)
    orders_as_buyer = serializers.IntegerField(default=0)
    orders_as_seller = serializers.IntegerField(default=0)
