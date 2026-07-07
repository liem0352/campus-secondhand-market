"""补下失败的外链图 + 验证 /media/ 路由可访问"""
import os, sys, django, urllib.request, time

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "..", "backend"))
os.chdir(os.path.join(ROOT, "..", "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from market.models import ProductImage
from django.conf import settings

MEDIA_DIR = os.path.join(settings.BASE_DIR, "media", "products")
os.makedirs(MEDIA_DIR, exist_ok=True)


def download_with_retry(url, path, retries=4):
    """重试下载"""
    for i in range(retries):
        try:
            time.sleep(0.5 + i * 0.5)
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0)",
                "Accept": "image/*",
            })
            with urllib.request.urlopen(req, timeout=20) as r:
                data = r.read()
            if len(data) > 1024:
                with open(path, "wb") as f:
                    f.write(data)
                return True
        except Exception as e:
            print(f"  retry {i+1}/{retries}: {e}")
    return False


# 找剩下还指向 http 的图
remaining = ProductImage.objects.filter(image_url__startswith="http")
print(f"剩余外链: {remaining.count()} 张")

for img in remaining:
    fname = f"p{img.product_id}_{img.sort_order:02d}.jpg"
    local_path = os.path.join(MEDIA_DIR, fname)
    new_url = f"/media/products/{fname}"

    if download_with_retry(img.image_url, local_path):
        img.image_url = new_url
        img.save(update_fields=["image_url"])
        print(f"  [OK] #{img.product_id} img-{img.sort_order}  ->  {new_url}")
    else:
        print(f"  [STILL FAIL] #{img.product_id}  保留原 URL: {img.image_url}")

print(f"\n最终: /media/ 本地: {ProductImage.objects.filter(image_url__startswith='/media/').count()}")
