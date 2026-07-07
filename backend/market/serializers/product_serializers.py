"""
market.serializers.product_serializers
======================================

商品 / 商品图片 序列化器。
- :class:`ProductImageSerializer`  商品图片
- :class:`ProductBriefSerializer`  列表/瀑布流使用
- :class:`ProductDetailSerializer` 详情页使用
- :class:`ProductCreateSerializer`  发布商品
- :class:`ProductUpdateSerializer`  更新商品
"""
from rest_framework import serializers

from market.models import Product, ProductImage

from .category_serializers import CategorySerializer
from .user_serializers import UserBriefSerializer


class ProductImageSerializer(serializers.ModelSerializer):
    """商品图片序列化器（图片 URL 字段已自动补全为绝对路径）。"""

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'sort_order']
        read_only_fields = ['id']

    def get_image_url(self, obj: ProductImage) -> str:
        """返回图片的绝对 URL，方便小程序 <image> 直接使用。

        - 已是 http(s):// 直接返回
        - 相对路径（/media/...）拼接当前请求的 base URL
        """
        url = obj.image_url or ''
        if not url:
            return ''
        if url.startswith(('http://', 'https://')):
            return url
        request = self.context.get('request') if self.context else None
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class ProductBriefSerializer(serializers.ModelSerializer):
    """商品"概要"序列化器 — 列表 / 瀑布流 / 搜索结果使用。

    字段说明：
        cover           封面图 URL（取第一张图片）
        condition_display 成色中文
        seller          卖家简要信息
    """

    cover = serializers.SerializerMethodField()
    seller = UserBriefSerializer(read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'price', 'original_price', 'condition', 'condition_display',
            'status', 'status_display', 'school', 'cover',
            'view_count', 'favorite_count', 'seller', 'created_at',
        ]

    def get_cover(self, obj: Product) -> str:
        """返回商品第一张图片的 URL；无图则空串。"""
        first = obj.images.first()
        if not first:
            return ''
        url = first.image_url or ''
        if not url:
            return ''
        if url.startswith(('http://', 'https://')):
            return url
        if url.startswith('/assets/'):
            return url
        request = self.context.get('request') if self.context else None
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class ProductDetailSerializer(ProductBriefSerializer):
    """商品详情序列化器 — 详情页使用，扩展更多字段。"""

    images = ProductImageSerializer(many=True, read_only=True)
    description = serializers.CharField()
    category = CategorySerializer(read_only=True)

    class Meta(ProductBriefSerializer.Meta):
        fields = ProductBriefSerializer.Meta.fields + [
            'description', 'images', 'category', 'audited_at', 'sold_at',
        ]


class ProductCreateSerializer(serializers.ModelSerializer):
    """商品发布入参。

    字段说明：
        category      一级或二级分类 ID
        title         标题（≤64）
        description   描述（≤500）
        price         售价
        original_price 原价（可空）
        condition     成色
        image_urls    图片 URL 列表（1-9 张）
    """

    image_urls = serializers.ListField(
        child=serializers.URLField(max_length=512),
        write_only=True,
        min_length=1, max_length=9,
    )

    class Meta:
        model = Product
        fields = [
            'category', 'title', 'description', 'price', 'original_price', 'condition',
            'image_urls',
        ]

    def validate_price(self, value):
        """价格必须为正数。"""
        if value is None or value <= 0:
            raise serializers.ValidationError('价格必须大于 0')
        return value

    def validate_original_price(self, value):
        """原价若提供须为正数；不提供允许为 None。"""
        if value is not None and value <= 0:
            raise serializers.ValidationError('原价必须大于 0')
        return value

    def create(self, validated_data: dict) -> Product:
        """保存商品 + 关联图片；自动从 request 取卖家与学校。"""
        image_urls = validated_data.pop('image_urls')
        request = self.context.get('request')
        seller = request.user if request else None
        # 信用分 >= 90 自动通过审核；否则进入 pending
        status = 'on_sale' if (seller and seller.credit_score >= 90) else 'pending'
        product = Product.objects.create(
            seller=seller,
            status=status,
            school=(seller.school if seller else '') or '',
            **validated_data,
        )
        for idx, url in enumerate(image_urls):
            ProductImage.objects.create(product=product, image_url=url, sort_order=idx)
        return product


class ProductUpdateSerializer(serializers.ModelSerializer):
    """商品更新入参（仅允许更新部分字段）。"""

    class Meta:
        model = Product
        fields = ['title', 'description', 'price', 'original_price', 'condition', 'category']
