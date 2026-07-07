from rest_framework import serializers

from finance.models import AiChatHistory, Budget, Category, Expense


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'type', 'sort_order', 'is_system', 'created_at']
        read_only_fields = ['id', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    category_type = serializers.CharField(source='category.type', read_only=True)
    user_nickname = serializers.CharField(source='user.nickname', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'user', 'user_nickname', 'category', 'category_name', 'category_icon',
            'category_type', 'amount', 'description', 'expense_date', 'source',
            'voice_log', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'source', 'voice_log']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('金额必须大于 0')
        return value


class ExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['category', 'amount', 'description', 'expense_date']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('金额必须大于 0')
        return value


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Budget
        fields = ['id', 'user', 'category', 'category_name', 'amount', 'month', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class AiChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiChatHistory
        fields = ['id', 'chat_type', 'question', 'answer', 'tokens_used', 'created_at']
        read_only_fields = fields
