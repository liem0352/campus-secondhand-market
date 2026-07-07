"""
下载 picsum 图片到 backend/media/products/，并更新数据库 image_url
- 架构：所有商品图走"用户上传 → 后端 /media/ → 三端"链路
- 脚本：把 picsum 在线图下载到本地 media 目录，再把数据库 URL 改为本地路径
- 前端就能直接 GET http://<host>:8000/media/products/xxx.jpg
"""
import os, sys, django, urllib.request, time

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "..", "backend"))
os.chdir(os.path.join(ROOT, "..", "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from market.models import Product, ProductImage
from django.conf import settings

MEDIA_DIR = os.path.join(settings.BASE_DIR, "media", "products")
os.makedirs(MEDIA_DIR, exist_ok=True)
print(f"[扫描] media 目录: {MEDIA_DIR}")


def download(url: str, path: str) -> bool:
    """下载 url 到 path，已存在则跳过"""
    if os.path.exists(path) and os.path.getsize(path) > 1024:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            with open(path, "wb") as f:
                f.write(resp.read())
        return os.path.getsize(path) > 1024
    except Exception as e:
        print(f"    [下载失败] {url}  ({e})")
        return False


def main():
    print("=" * 60)
    print(" 下载 picsum 图到后端 media + 更新数据库 URL")
    print("=" * 60)

    fixed = 0
    for img in ProductImage.objects.all().order_by("product_id", "sort_order"):
        url = img.image_url or ""
        # 跳过已经是 /media/ 路径的
        if url.startswith("/media/") or url.startswith(settings.MEDIA_URL):
            continue
        # 跳过不是 picsum 的（比如已经是 HTTP 外部的合法图）
        if not url.startswith("http"):
            continue

        # 文件名：p<product_id>_<sort_order:02d>.jpg
        fname = f"p{img.product_id}_{img.sort_order:02d}.jpg"
        local_path = os.path.join(MEDIA_DIR, fname)
        new_url = f"/media/products/{fname}"

        ok = download(url, local_path)
        if ok:
            img.image_url = new_url
            img.save(update_fields=["image_url"])
            fixed += 1
            if fixed <= 3:
                print(f"  [OK] #{img.product_id} img-{img.sort_order}  ->  {new_url}")
        else:
            print(f"  [FAIL] #{img.product_id} img-{img.sort_order}  保留原 URL: {url}")

        time.sleep(0.05)  # 防止 picsum 限流

    print(f"\n[完成] 更新 {fixed} 张图  本地媒体目录: {MEDIA_DIR}")
    print(f"现在数据库: {ProductImage.objects.count()} 张图")
    print(f"  /media/ 本地: {ProductImage.objects.filter(image_url__startswith='/media/').count()} 张")
    print(f"  外链: {ProductImage.objects.filter(image_url__startswith='http').count()} 张\n")


if __name__ == "__main__":
    main()
