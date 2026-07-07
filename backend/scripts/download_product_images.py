#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
联网下载所有商品图片到 backend/media/products/，并把 image_url 改写为本地相对路径。
- 输入：market_product_image 表中所有 URL
- 输出：backend/media/products/{product_id}_{idx}.jpg
- 同步更新数据库
- 幂等：第二次运行不会重复下载
"""
import os
import re
import ssl
import sys
import urllib.request
import pymysql

BACKEND = r"d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\backend"
MEDIA_DIR = os.path.join(BACKEND, "media", "products")
os.makedirs(MEDIA_DIR, exist_ok=True)

# ---------- MySQL ----------
DB = dict(host="127.0.0.1", port=3306, user="root", password="tyb1124",
          database="campus_market", charset="utf8mb4")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CampusMarket/1.0"}


def fetch(url: str, timeout=30) -> bytes:
    """下载 URL 内容，失败抛异常"""
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=timeout) as r:
        return r.read()


def main():
    conn = pymysql.connect(**DB)
    cur = conn.cursor()
    cur.execute("SELECT id, product_id, image_url FROM market_product_image ORDER BY product_id, id")
    rows = cur.fetchall()
    print(f"待处理图片：{len(rows)} 张")

    ok = skip = fail = 0
    for img_id, product_id, url in rows:
        # 已经迁移到本地的：直接跳过
        if url and url.startswith("/media/"):
            skip += 1
            continue

        # 计算本地路径
        ext = ".jpg"
        m = re.search(r"\.(jpg|jpeg|png|webp|gif)(?:\?|$)", url, re.I)
        if m:
            ext = "." + m.group(1).lower()
        local_name = f"p{product_id}_{img_id}{ext}"
        local_abs = os.path.join(MEDIA_DIR, local_name)
        local_url = f"/media/products/{local_name}"

        # 已下载过
        if os.path.exists(local_abs) and os.path.getsize(local_abs) > 1024:
            new_url = local_url
        else:
            try:
                data = fetch(url)
                with open(local_abs, "wb") as f:
                    f.write(data)
                new_url = local_url
                ok += 1
            except Exception as e:
                print(f"  [FAIL] {url} -> {e}")
                fail += 1
                continue

        # 更新数据库
        if new_url != url:
            cur.execute("UPDATE market_product_image SET image_url=%s WHERE id=%s", (new_url, img_id))

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n结果：下载 {ok} 张，跳过 {skip} 张，失败 {fail} 张")
    print(f"本地目录：{MEDIA_DIR}")


if __name__ == "__main__":
    main()
