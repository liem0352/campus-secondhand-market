#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成一张分类图标对比预览图（5x7 网格）"""
import os
from PIL import Image, ImageDraw, ImageFont

ASSETS = r"d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\miniprogram\assets\icons"
OUT = r"d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\miniprogram\assets\preview.png"

icons = [
    ("book-open", "教材书籍"),
    ("laptop",    "电子产品"),
    ("sofa",      "生活用品"),
    ("apparel",   "服饰鞋帽"),
    ("music-2",   "乐器"),
    ("dumbbell",  "运动器材"),
    ("package",   "其他"),
    ("book",      "教材"),
    ("school",    "教程"),
    ("phone",     "手机"),
    ("camera",    "相机"),
    ("bed",       "床"),
    ("utensils",  "餐具"),
    ("droplet",   "水滴"),
    ("cookie",    "饼干"),
    ("bike",      "自行车"),
    ("watch",     "手表"),
    ("piano",     "钢琴"),
    ("drum",      "鼓"),
    ("file-check","考试"),
]

CELL = 120
COLS = 5
ROWS = (len(icons) + COLS - 1) // COLS

canvas = Image.new("RGBA", (COLS * CELL, ROWS * CELL + 20), (255, 245, 235, 255))
draw = ImageDraw.Draw(canvas)

# 尝试用默认字体
try:
    font = ImageFont.truetype("arial.ttf", 14)
except Exception:
    font = ImageFont.load_default()

for i, (name, label) in enumerate(icons):
    p = os.path.join(ASSETS, f"{name}.png")
    if not os.path.exists(p):
        continue
    img = Image.open(p).convert("RGBA").resize((80, 80))
    r, c = divmod(i, COLS)
    x = c * CELL + 20
    y = r * CELL + 10
    # 背景圆
    draw.ellipse([x - 4, y - 4, x + 84, y + 84], fill=(255, 255, 255, 255), outline=(200, 200, 200, 255), width=1)
    canvas.paste(img, (x, y), img)
    # 标签
    draw.text((x + 2, y + 86), label, fill=(40, 40, 40, 255), font=font)

canvas.save(OUT)
print(f"OK -> {OUT}")
print(f"size = {os.path.getsize(OUT)} bytes")
