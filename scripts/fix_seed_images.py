"""
为所有没有图片的商品补充 picsum 占位图（升级版）
- 场景：数据库迁移 / 重置时 ProductImage 被清空，但 Product 还在
- 行为：扫所有 status='on_sale' 且 images.count() == 0 的商品，
        每件创建 3 张 picsum 图（封面 + 副图1 + 副图2）
- 幂等：可重复执行，已有图的商品不动
"""
import os, sys, django
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "..", "backend"))
os.chdir(os.path.join(ROOT, "..", "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from market.models import Product, ProductImage

WIDTH, HEIGHT = 800, 800
DEFAULT_IMG_COUNT = 3  # 每件商品默认 3 张


def picsum_for(product_id: int, idx: int) -> str:
    """基于商品 id + 图片序号生成稳定 seed 的 picsum URL"""
    seed = f"campus-bang-p{product_id}-{idx}"
    return f"https://picsum.photos/seed/{seed}/{WIDTH}/{HEIGHT}"


def main():
    print("=" * 60)
    print(" 为无图商品补充 picsum 占位图")
    print("=" * 60)
    print(f"\n[扫描] 商品总数: {Product.objects.count()}")
    print(f"[扫描] 图片总数: {ProductImage.objects.count()}")

    # 找出所有需要补图的商品（在售 + 草稿 + 待审核都补，售罄下架的不补）
    need_pics = []
    for p in Product.objects.filter(status__in=["on_sale", "pending", "draft"]):
        if p.images.count() == 0:
            need_pics.append(p)
    print(f"[扫描] {len(need_pics)} 件商品缺图")

    created = 0
    for p in need_pics:
        for i in range(DEFAULT_IMG_COUNT):
            ProductImage.objects.create(
                product=p,
                image_url=picsum_for(p.id, i),
                sort_order=i,
            )
            created += 1
        print(f"  [补图] #{p.id}  {p.title!r}  +{DEFAULT_IMG_COUNT} 张")

    print(f"\n[完成] 补图 {created} 张  涉及 {len(need_pics)} 件商品")
    print("现在数据库总图片数: {}".format(ProductImage.objects.count()))
    print("刷新前端页面应该能看到所有商品都有图了。\n")


if __name__ == "__main__":
    main()
