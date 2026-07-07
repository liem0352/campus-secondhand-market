#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 SVG 图标批量转换为 PNG（微信小程序 image 组件不支持本地 SVG）。
- 方案：纯 PIL 绘制，不依赖 cairo / svglib
- 对于复杂的图标按 SVG 语义 + 简单几何体近似还原
- 输出尺寸 96x96，与已有 PNG 一致
"""
import os
from PIL import Image, ImageDraw

ASSETS = r"d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\miniprogram\assets"

# 颜色
INK = "#333333"           # 默认描边/前景色
INK_SOFT = "#999999"      # 弱化色
ACCENT = "#FF6B35"        # 主题色（与小程序主题一致）
SUCCESS = "#34C759"
WARNING = "#FF9500"
ERROR = "#FF3B30"
WHITE = "#FFFFFF"
BLACK = "#1A1A1A"

SIZE = 96  # 输出 PNG 尺寸 96x96

def new_canvas():
    """创建 96x96 透明画布"""
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

def save_png(img, out_path):
    """保存为 PNG"""
    img = img.convert("RGBA")
    img.save(out_path, "PNG", optimize=True)
    print(f"  OK  {os.path.basename(out_path)}")

def line(d, x0, y0, x1, y1, color=INK, w=4):
    """画一条粗线"""
    d.line([(x0, y0), (x1, y1)], fill=color, width=w)

def rect(d, x, y, w, h, color=INK, lw=4, fill=None, r=8):
    """画带圆角的矩形"""
    if fill is not None:
        d.rounded_rectangle([x, y, x + w, y + h], radius=r, fill=fill)
    d.rounded_rectangle([x, y, x + w, y + h], radius=r, outline=color, width=lw)

def circle(d, x, y, r, color=INK, lw=4, fill=None):
    """画一个圆"""
    if fill is not None:
        d.ellipse([x - r, y - r, x + r, y + r], fill=fill)
    d.ellipse([x - r, y - r, x + r, y + r], outline=color, width=lw)

def arc(d, x, y, r, start, end, color=INK, lw=4, fill=None):
    """画一段弧/扇形"""
    bbox = [x - r, y - r, x + r, y + r]
    if fill is not None:
        d.pieslice(bbox, start, end, fill=fill)
    d.arc(bbox, start, end, fill=color, width=lw)

def poly(d, points, color=INK, lw=3, fill=None):
    """画多边形"""
    if fill is not None:
        d.polygon(points, fill=fill)
    d.polygon(points, outline=color, width=lw)


# ============================================================
# TabBar 图标
# ============================================================

def draw_home(active=False):
    img = new_canvas(); d = ImageDraw.Draw(img)
    color = ACCENT if active else INK
    d.polygon([(16, 48), (48, 16), (80, 48)], outline=color, width=4, fill=None)
    rect(d, 24, 44, 48, 36, color=color, lw=4, r=4)
    d.rectangle([42, 60, 54, 80], outline=color, width=3)
    return img

def draw_category(active=False):
    img = new_canvas(); d = ImageDraw.Draw(img)
    color = ACCENT if active else INK
    for i in range(3):
        for j in range(3):
            x = 18 + j * 24
            y = 18 + i * 24
            d.rounded_rectangle([x, y, x + 14, y + 14], radius=2,
                fill=color if (i + j) % 2 == 0 else None, outline=color, width=2)
    return img

def draw_publish(active=False):
    img = new_canvas(); d = ImageDraw.Draw(img)
    color = WHITE if active else INK
    bg = ACCENT if active else None
    rect(d, 20, 28, 56, 52, color=color, lw=4, r=8, fill=bg)
    d.line([(48, 38), (48, 70)], fill=color, width=5)
    d.line([(32, 54), (64, 54)], fill=color, width=5)
    return img

def draw_chat(active=False):
    img = new_canvas(); d = ImageDraw.Draw(img)
    color = ACCENT if active else INK
    d.rounded_rectangle([14, 22, 82, 66], radius=12, outline=color, width=4, fill=None)
    d.polygon([(28, 66), (40, 80), (40, 66)], outline=color, width=3, fill=None)
    circle(d, 32, 44, 3, color=color, lw=0, fill=color)
    circle(d, 48, 44, 3, color=color, lw=0, fill=color)
    circle(d, 64, 44, 3, color=color, lw=0, fill=color)
    return img

def draw_mine(active=False):
    img = new_canvas(); d = ImageDraw.Draw(img)
    color = ACCENT if active else INK
    circle(d, 48, 32, 14, color=color, lw=4, fill=None)
    d.arc([16, 48, 80, 92], 180, 360, fill=color, width=4)
    return img


# ============================================================
# 通用功能图标
# ============================================================

def draw_search():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 42, 42, 22, color=INK, lw=4, fill=None)
    line(d, 60, 60, 80, 80, color=INK, w=6)
    return img

def draw_favorite(active=False):
    img = new_canvas(); d = ImageDraw.Draw(img)
    color = ERROR if active else INK
    d.polygon([
        (48, 80), (16, 48), (24, 28), (40, 24), (48, 36),
        (56, 24), (72, 28), (80, 48)
    ], fill=color)
    return img

def draw_avatar():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 36, 16, color=INK_SOFT, lw=3, fill=INK_SOFT)
    d.arc([16, 52, 80, 96], 180, 360, fill=INK_SOFT, width=3)
    return img

def draw_image():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 14, 22, 68, 52, color=INK, lw=4, r=4, fill=None)
    circle(d, 32, 38, 4, color=INK, lw=0, fill=INK)
    d.polygon([(28, 64), (50, 44), (62, 54), (74, 64)], outline=INK, width=3, fill=None)
    return img

def draw_empty():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.rounded_rectangle([24, 24, 72, 80], radius=4, outline=INK_SOFT, width=3, fill=None)
    d.line([(24, 32), (72, 32)], fill=INK_SOFT, width=3)
    return img

def draw_status_error():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 48, 28, color=ERROR, lw=4, fill=None)
    line(d, 36, 36, 60, 60, color=ERROR, w=5)
    line(d, 60, 36, 36, 60, color=ERROR, w=5)
    return img

def draw_status_success():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 48, 28, color=SUCCESS, lw=4, fill=None)
    d.line([(34, 50), (44, 60), (64, 38)], fill=SUCCESS, width=5)
    return img

def draw_status_warning():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 16), (80, 76), (16, 76)], outline=WARNING, width=4, fill=None)
    line(d, 48, 36, 48, 56, color=WARNING, w=4)
    d.ellipse([44, 60, 52, 68], fill=WARNING)
    return img

def draw_arrow_left():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 64, 48, 32, 48, color=INK, w=5)
    line(d, 32, 48, 48, 32, color=INK, w=5)
    line(d, 32, 48, 48, 64, color=INK, w=5)
    return img

def draw_arrow_right():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 32, 48, 64, 48, color=INK, w=5)
    line(d, 64, 48, 48, 32, color=INK, w=5)
    line(d, 64, 48, 48, 64, color=INK, w=5)
    return img

def draw_arrow_down():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 48, 32, 48, 64, color=INK, w=5)
    line(d, 48, 64, 32, 48, color=INK, w=5)
    line(d, 48, 64, 64, 48, color=INK, w=5)
    return img

def draw_close():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 30, 30, 66, 66, color=INK, w=5)
    line(d, 66, 30, 30, 66, color=INK, w=5)
    return img

def draw_check():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.line([(24, 48), (42, 66), (72, 30)], fill=SUCCESS, width=6)
    return img

def draw_delete():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 24, 28, 48, 52, color=INK, lw=4, r=4)
    line(d, 16, 28, 80, 28, color=INK, w=4)
    line(d, 40, 20, 56, 20, color=INK, w=4)
    line(d, 40, 24, 56, 24, color=INK, w=2)
    for x in [34, 48, 62]:
        line(d, x, 38, x, 72, color=INK, w=3)
    return img

def draw_edit():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(56, 16), (80, 40), (44, 76), (20, 80), (24, 56)], outline=INK, width=3, fill=None)
    line(d, 56, 16, 80, 40, color=INK, w=2)
    return img

def draw_share():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 24, 24, 6, color=INK, lw=3, fill=None)
    circle(d, 72, 48, 6, color=INK, lw=3, fill=None)
    circle(d, 24, 72, 6, color=INK, lw=3, fill=None)
    line(d, 30, 28, 66, 44, color=INK, w=3)
    line(d, 30, 68, 66, 52, color=INK, w=3)
    return img

def draw_camera():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 12, 28, 72, 50, color=INK, lw=4, r=8)
    rect(d, 36, 22, 24, 12, color=INK, lw=3, r=3)
    circle(d, 48, 52, 14, color=INK, lw=3, fill=None)
    return img

def draw_camera_plus():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 12, 28, 72, 50, color=INK, lw=4, r=8)
    rect(d, 36, 22, 24, 12, color=INK, lw=3, r=3)
    circle(d, 48, 52, 11, color=INK, lw=3, fill=None)
    line(d, 48, 46, 48, 58, color=INK, w=3)
    line(d, 42, 52, 54, 52, color=INK, w=3)
    return img

def draw_mic():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.rounded_rectangle([38, 18, 58, 56], radius=10, outline=INK, width=4, fill=None)
    d.arc([26, 36, 70, 80], 0, 180, fill=INK, width=4)
    line(d, 48, 80, 48, 88, color=INK, w=4)
    line(d, 38, 88, 58, 88, color=INK, w=4)
    return img

def draw_send():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(20, 48), (76, 16), (56, 48), (76, 80)], outline=INK, width=3, fill=None)
    return img

def draw_credit():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 16), (76, 48), (48, 80), (20, 48)], outline=WARNING, width=3, fill=None)
    line(d, 40, 52, 46, 58, color=WARNING, w=4)
    line(d, 46, 58, 58, 44, color=WARNING, w=4)
    return img

def draw_ai():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.ellipse([42, 42, 54, 54], fill=ACCENT)
    for cx, cy in [(48, 20), (48, 76), (20, 48), (76, 48)]:
        line(d, cx - 6, cy, cx + 6, cy, color=ACCENT, w=3)
        line(d, cx, cy - 6, cx, cy + 6, color=ACCENT, w=3)
    return img

def draw_plus():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 48, 24, 48, 72, color=INK, w=6)
    line(d, 24, 48, 72, 48, color=INK, w=6)
    return img

def draw_minus():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 24, 48, 72, 48, color=INK, w=6)
    return img

def draw_location():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 16), (72, 48), (48, 84), (24, 48)], outline=INK, width=3, fill=None)
    circle(d, 48, 44, 8, color=INK, lw=3, fill=None)
    return img

def draw_phone():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.rounded_rectangle([28, 14, 68, 82], radius=8, outline=INK, width=4, fill=None)
    line(d, 40, 70, 56, 70, color=INK, w=3)
    return img

def draw_clock():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 48, 28, color=INK, lw=4, fill=None)
    line(d, 48, 48, 48, 28, color=INK, w=3)
    line(d, 48, 48, 64, 56, color=INK, w=3)
    return img

def draw_school():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 14), (78, 30), (78, 56), (48, 84), (18, 56), (18, 30)], outline=ACCENT, width=3, fill=None)
    line(d, 34, 48, 62, 48, color=ACCENT, w=3)
    d.ellipse([42, 34, 54, 46], fill=ACCENT)
    return img

def draw_wallet():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 14, 28, 68, 44, color=INK, lw=4, r=6)
    circle(d, 64, 50, 6, color=INK, lw=3, fill=INK)
    return img

def draw_wallet2():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 14, 32, 60, 40, color=ACCENT, lw=4, r=4, fill=None)
    rect(d, 60, 44, 22, 16, color=ACCENT, lw=0, r=2, fill=ACCENT)
    return img

def draw_loading():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.arc([16, 16, 80, 80], 30, 300, fill=INK_SOFT, width=6)
    return img


# ============================================================
# 新增功能图标
# ============================================================

def draw_scan():
    """扫一扫：四个角的方框"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 左上
    d.line([(20, 32), (20, 20), (32, 20)], fill=INK, width=5)
    # 右上
    d.line([(64, 20), (76, 20), (76, 32)], fill=INK, width=5)
    # 右下
    d.line([(76, 64), (76, 76), (64, 76)], fill=INK, width=5)
    # 左下
    d.line([(32, 76), (20, 76), (20, 64)], fill=INK, width=5)
    # 中间扫描线
    line(d, 28, 48, 68, 48, color=ACCENT, w=3)
    return img

def draw_bell():
    """通知"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(28, 64), (28, 38), (48, 22), (68, 38), (68, 64)], outline=INK, width=4, fill=None)
    line(d, 24, 64, 72, 64, color=INK, w=4)
    arc(d, 42, 66, 6, 0, 180, color=INK, lw=4, fill=None)
    return img

def draw_eye():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(8, 48), (48, 18), (88, 48), (48, 78)], outline=INK, width=4, fill=None)
    circle(d, 48, 48, 10, color=INK, lw=3, fill=None)
    return img

def draw_eye_off():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(8, 48), (48, 18), (88, 48), (48, 78)], outline=INK, width=4, fill=None)
    circle(d, 48, 48, 8, color=INK, lw=3, fill=None)
    line(d, 16, 84, 84, 12, color=ERROR, w=4)
    return img

def draw_lock():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 22, 42, 52, 36, color=INK, lw=4, r=4, fill=None)
    d.arc([30, 18, 66, 50], 180, 360, fill=INK, width=4)
    line(d, 42, 56, 54, 56, color=INK, w=3)
    return img

def draw_user_x():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 36, 32, 12, color=INK, lw=4, fill=None)
    d.arc([14, 44, 58, 86], 180, 360, fill=INK, width=4)
    line(d, 60, 56, 86, 82, color=ERROR, w=5)
    line(d, 86, 56, 60, 82, color=ERROR, w=5)
    return img

def draw_megaphone():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(20, 40), (60, 24), (60, 72), (20, 56)], outline=INK, width=4, fill=None)
    line(d, 20, 40, 20, 56, color=INK, w=4)
    arc(d, 68, 36, 8, 300, 60, color=INK, lw=4)
    line(d, 14, 56, 14, 72, color=INK, w=3)
    return img

def draw_flame():
    """火焰/限时特惠"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 12), (28, 32), (32, 52), (40, 48), (36, 64), (56, 80), (60, 56), (68, 60), (72, 44), (60, 28)],
        outline=ERROR, width=3, fill=None)
    return img

def draw_chart():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 16, 80, 80, 80, color=INK, w=4)
    line(d, 16, 16, 16, 80, color=INK, w=4)
    # 柱
    rect(d, 26, 56, 10, 24, color=ACCENT, lw=0, r=2, fill=ACCENT)
    rect(d, 42, 40, 10, 40, color=ACCENT, lw=0, r=2, fill=ACCENT)
    rect(d, 58, 28, 10, 52, color=ACCENT, lw=0, r=2, fill=ACCENT)
    return img

def draw_help_circle():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 48, 30, color=INK, lw=4, fill=None)
    # 问号
    line(d, 40, 38, 48, 34, color=INK, w=4)
    line(d, 48, 34, 56, 38, color=INK, w=4)
    line(d, 56, 38, 56, 48, color=INK, w=4)
    line(d, 48, 48, 48, 56, color=INK, w=4)
    d.ellipse([44, 60, 52, 68], fill=INK)
    return img

def draw_message_square():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 12, 18, 72, 50, color=INK, lw=4, r=4, fill=None)
    d.polygon([(28, 68), (28, 80), (44, 68)], outline=INK, width=3, fill=None)
    return img

def draw_badge_check():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 12), (72, 22), (78, 48), (60, 76), (36, 76), (18, 48), (24, 22)],
        outline=SUCCESS, width=4, fill=None)
    d.line([(34, 48), (44, 58), (64, 38)], fill=SUCCESS, width=5)
    return img

def draw_message_circle():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 48, 32, color=INK, lw=4, fill=None)
    d.ellipse([30, 36, 38, 44], fill=INK)
    d.ellipse([44, 36, 52, 44], fill=INK)
    d.ellipse([58, 36, 66, 44], fill=INK)
    return img

def draw_headphones():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.arc([14, 30, 82, 76], 180, 360, fill=INK, width=4)
    rect(d, 14, 56, 16, 24, color=INK, lw=3, r=4, fill=INK)
    rect(d, 66, 56, 16, 24, color=INK, lw=3, r=4, fill=INK)
    return img

def draw_info():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 48, 30, color=INK, lw=4, fill=None)
    d.ellipse([44, 28, 52, 36], fill=INK)
    line(d, 48, 44, 48, 64, color=INK, w=5)
    return img

def draw_settings():
    """设置：两条横线 + 两个圆"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 20, 28, 76, 28, color=INK, w=4)
    line(d, 20, 68, 76, 68, color=INK, w=4)
    circle(d, 32, 28, 6, color=INK, lw=3, fill=WHITE)
    circle(d, 64, 68, 6, color=INK, lw=3, fill=WHITE)
    return img

def draw_log_out():
    """退出登录"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 14, 20, 38, 56, color=INK, lw=4, r=4, fill=None)
    line(d, 40, 48, 80, 48, color=INK, w=5)
    line(d, 64, 32, 80, 48, color=INK, w=5)
    line(d, 64, 64, 80, 48, color=INK, w=5)
    return img

def draw_moon():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.chord([14, 14, 82, 82], 270, 90, fill=INK, outline=INK, width=2)
    d.chord([22, 18, 86, 86], 270, 90, fill=WHITE, outline=None)
    return img

def draw_globe():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 48, 30, color=INK, lw=4, fill=None)
    line(d, 18, 48, 78, 48, color=INK, w=3)
    d.ellipse([30, 18, 66, 78], outline=INK, width=3)
    line(d, 48, 18, 48, 78, color=INK, w=2)
    return img

def draw_package():
    """包裹"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 16, 32, 64, 48, color=INK, lw=4, r=4, fill=None)
    rect(d, 16, 22, 64, 14, color=INK, lw=4, r=2, fill=None)
    line(d, 48, 22, 48, 80, color=INK, w=3)
    return img

def draw_shopping_bag():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 18, 32, 60, 48, color=INK, lw=4, r=4, fill=None)
    d.arc([28, 18, 68, 50], 0, 180, fill=INK, width=4)
    return img

def draw_tag():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(20, 20), (60, 20), (80, 48), (60, 76), (20, 76)], outline=INK, width=4, fill=None)
    d.ellipse([28, 40, 36, 48], fill=INK)
    return img

def draw_grid():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 16, 16, 26, 26, color=INK, lw=3, r=3, fill=INK)
    rect(d, 54, 16, 26, 26, color=INK, lw=3, r=3, fill=INK)
    rect(d, 16, 54, 26, 26, color=INK, lw=3, r=3, fill=INK)
    rect(d, 54, 54, 26, 26, color=INK, lw=3, r=3, fill=INK)
    return img

def draw_truck():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 12, 32, 44, 32, color=INK, lw=4, r=2, fill=None)
    d.polygon([(56, 42), (68, 42), (80, 56), (80, 64), (56, 64)], outline=INK, width=3, fill=None)
    circle(d, 28, 68, 6, color=INK, lw=2, fill=INK)
    circle(d, 68, 68, 6, color=INK, lw=2, fill=INK)
    return img

def draw_lightbulb():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 14), (32, 28), (32, 50), (40, 56), (40, 64), (56, 64), (56, 56), (64, 50), (64, 28)],
        outline=WARNING, width=3, fill=None)
    rect(d, 40, 64, 16, 8, color=WARNING, lw=0, fill=WARNING)
    rect(d, 42, 72, 12, 6, color=WARNING, lw=0, fill=WARNING)
    return img

def draw_user():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 30, 14, color=INK, lw=4, fill=None)
    d.arc([16, 48, 80, 92], 180, 360, fill=INK, width=4)
    return img

def draw_users():
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 36, 30, 12, color=INK, lw=4, fill=None)
    circle(d, 64, 30, 10, color=INK, lw=3, fill=None)
    d.arc([14, 44, 58, 86], 180, 360, fill=INK, width=4)
    d.arc([50, 44, 86, 86], 180, 360, fill=INK, width=3)
    return img

def draw_shield():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 14), (76, 24), (76, 50), (48, 84), (20, 50), (20, 24)], outline=INK, width=4, fill=None)
    return img

def draw_zap():
    """闪电"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(54, 10), (26, 52), (44, 52), (40, 86), (72, 40), (52, 40), (58, 10)], outline=WARNING, width=3, fill=WARNING)
    return img

def draw_award():
    """奖牌"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 38, 22, color=ACCENT, lw=4, fill=None)
    d.line([(30, 56), (24, 84), (48, 72), (72, 84), (66, 56)], fill=ACCENT, width=4)
    d.ellipse([40, 30, 56, 46], fill=ACCENT)
    return img

def draw_bookmark():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(28, 16), (68, 16), (68, 80), (48, 64), (28, 80)], outline=INK, width=4, fill=None)
    return img

def draw_credit_card():
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 12, 24, 72, 48, color=INK, lw=4, r=4, fill=None)
    line(d, 12, 38, 84, 38, color=INK, w=4)
    line(d, 22, 56, 42, 56, color=INK, w=3)
    return img

def draw_filter():
    """筛选/滑块"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 14, 28, 82, 28, color=INK, w=3)
    line(d, 14, 48, 82, 48, color=INK, w=3)
    line(d, 14, 68, 82, 68, color=INK, w=3)
    circle(d, 36, 28, 5, color=ACCENT, lw=0, fill=ACCENT)
    circle(d, 56, 48, 5, color=ACCENT, lw=0, fill=ACCENT)
    circle(d, 44, 68, 5, color=ACCENT, lw=0, fill=ACCENT)
    return img

def draw_refresh():
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.arc([14, 18, 78, 78], 30, 300, fill=INK, width=5)
    d.polygon([(78, 32), (78, 50), (60, 42)], outline=INK, width=3, fill=None)
    d.arc([18, 18, 82, 78], 210, 120, fill=INK, width=5)
    d.polygon([(18, 64), (18, 46), (36, 54)], outline=INK, width=3, fill=None)
    return img

def draw_more():
    """更多（横排三点）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.ellipse([18, 44, 28, 54], fill=INK)
    d.ellipse([44, 44, 54, 54], fill=INK)
    d.ellipse([70, 44, 80, 54], fill=INK)
    return img

def draw_list():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 28, 26, 80, 26, color=INK, w=4)
    line(d, 28, 48, 80, 48, color=INK, w=4)
    line(d, 28, 70, 80, 70, color=INK, w=4)
    d.ellipse([16, 22, 24, 30], fill=INK)
    d.ellipse([16, 44, 24, 52], fill=INK)
    d.ellipse([16, 66, 24, 74], fill=INK)
    return img

def draw_upload():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 24, 80, 72, 80, color=INK, w=4)
    line(d, 48, 70, 48, 24, color=INK, w=4)
    line(d, 32, 38, 48, 22, color=INK, w=4)
    line(d, 64, 38, 48, 22, color=INK, w=4)
    return img

def draw_download():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 24, 80, 72, 80, color=INK, w=4)
    line(d, 48, 24, 48, 70, color=INK, w=4)
    line(d, 32, 56, 48, 72, color=INK, w=4)
    line(d, 64, 56, 48, 72, color=INK, w=4)
    return img


# ============================================================
# 分类专用图标
# ============================================================

def draw_book():
    """书本"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(20, 16), (76, 16), (76, 80), (20, 80)], outline=INK, width=3, fill=None)
    line(d, 20, 26, 76, 26, color=INK, w=3)
    line(d, 28, 38, 68, 38, color=INK, w=2)
    line(d, 28, 48, 68, 48, color=INK, w=2)
    line(d, 28, 58, 60, 58, color=INK, w=2)
    return img

def draw_apparel():
    """T恤"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(20, 24), (36, 14), (44, 24), (52, 24), (60, 14), (76, 24), (76, 40), (68, 44), (68, 82), (28, 82), (28, 44), (20, 40)],
        outline=INK, width=3, fill=None)
    d.arc([40, 16, 56, 32], 0, 180, fill=INK, width=2)
    return img

def draw_laptop():
    """电脑"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 16, 22, 64, 44, color=INK, lw=4, r=4, fill=None)
    line(d, 12, 72, 84, 72, color=INK, w=4)
    return img

def draw_bike():
    """自行车"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 24, 64, 12, color=INK, lw=4, fill=None)
    circle(d, 72, 64, 12, color=INK, lw=4, fill=None)
    line(d, 24, 64, 48, 36, color=INK, w=3)
    line(d, 48, 36, 72, 64, color=INK, w=3)
    line(d, 36, 64, 60, 64, color=INK, w=3)
    line(d, 48, 36, 56, 24, color=INK, w=3)
    return img

def draw_gift():
    """礼物"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 16, 36, 64, 44, color=INK, lw=4, r=4, fill=None)
    rect(d, 14, 28, 68, 12, color=INK, lw=4, r=2, fill=None)
    line(d, 48, 28, 48, 80, color=INK, w=4)
    d.arc([30, 14, 50, 36], 0, 180, fill=INK, width=3)
    d.arc([46, 14, 66, 36], 0, 180, fill=INK, width=3)
    return img

def draw_utensils():
    """餐具"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 28, 18, 28, 80, color=INK, w=4)
    line(d, 40, 18, 40, 80, color=INK, w=4)
    d.polygon([(24, 18), (24, 50), (34, 60), (44, 50), (44, 18)], outline=INK, width=3, fill=None)
    d.polygon([(56, 18), (56, 40), (60, 44), (60, 18)], outline=INK, width=3, fill=None)
    d.polygon([(66, 18), (66, 40), (70, 36), (70, 18)], outline=INK, width=3, fill=None)
    return img

def draw_sofa():
    """沙发"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 16, 36, 64, 36, color=INK, lw=4, r=8, fill=None)
    rect(d, 12, 50, 12, 24, color=INK, lw=3, r=4, fill=None)
    rect(d, 72, 50, 12, 24, color=INK, lw=3, r=4, fill=None)
    line(d, 16, 44, 80, 44, color=INK, w=2)
    return img

def draw_dumbbell():
    """哑铃"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 36, 48, 60, 48, color=INK, w=4)
    rect(d, 24, 36, 12, 24, color=INK, lw=3, r=2, fill=None)
    rect(d, 60, 36, 12, 24, color=INK, lw=3, r=2, fill=None)
    rect(d, 16, 42, 8, 12, color=INK, lw=3, r=2, fill=None)
    rect(d, 72, 42, 8, 12, color=INK, lw=3, r=2, fill=None)
    return img

def draw_sparkles():
    """闪光/美妆"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 14), (54, 40), (80, 46), (54, 52), (48, 78), (42, 52), (16, 46), (42, 40)], outline=ACCENT, width=3, fill=None)
    d.polygon([(76, 14), (80, 26), (92, 30), (80, 34), (76, 46), (72, 34), (60, 30), (72, 26)], outline=ACCENT, width=2, fill=None)
    return img

def draw_pet():
    """宠物（猫脸）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(20, 20), (40, 32), (56, 32), (76, 20), (76, 56), (48, 84), (20, 56)], outline=INK, width=3, fill=None)
    d.polygon([(20, 20), (24, 36), (40, 32)], outline=INK, width=3, fill=None)
    d.polygon([(76, 20), (72, 36), (56, 32)], outline=INK, width=3, fill=None)
    d.ellipse([36, 44, 44, 52], fill=INK)
    d.ellipse([52, 44, 60, 52], fill=INK)
    d.polygon([(44, 60), (52, 60), (48, 66)], fill=INK)
    return img

def draw_music():
    img = new_canvas(); d = ImageDraw.Draw(img)
    line(d, 36, 18, 36, 64, color=INK, w=4)
    line(d, 68, 18, 68, 56, color=INK, w=4)
    line(d, 36, 18, 68, 14, color=INK, w=3)
    line(d, 36, 26, 68, 22, color=INK, w=3)
    circle(d, 30, 64, 8, color=INK, lw=3, fill=None)
    circle(d, 62, 56, 8, color=INK, lw=3, fill=None)
    return img

def draw_wrench():
    """扳手"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(60, 14), (80, 30), (60, 46), (50, 36), (50, 50), (20, 80), (14, 74), (44, 44), (44, 34)],
        outline=INK, width=3, fill=None)
    return img

def draw_baby():
    """婴儿"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 36, 22, color=INK, lw=4, fill=None)
    d.ellipse([40, 30, 44, 34], fill=INK)
    d.ellipse([52, 30, 56, 34], fill=INK)
    d.arc([40, 40, 56, 52], 0, 180, fill=INK, width=2)
    d.ellipse([38, 26, 42, 32], outline=INK, width=2)
    d.ellipse([54, 26, 58, 32], outline=INK, width=2)
    line(d, 36, 60, 60, 60, color=INK, w=3)
    return img

def draw_medal():
    """奖牌（备份）"""
    return draw_award()


# ============================================================
# 后端 init_categories.py 实际使用的 Lucide 短名补全
# ============================================================

def draw_book_open():
    """book-open：打开的书（教材书籍一级分类）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 中线
    line(d, 48, 22, 48, 80, color=INK, w=3)
    # 左页
    d.polygon([(16, 26), (48, 22), (48, 78), (16, 74)], outline=INK, width=3, fill=None)
    # 右页
    d.polygon([(48, 22), (80, 26), (80, 74), (48, 78)], outline=INK, width=3, fill=None)
    # 文字线
    line(d, 22, 36, 42, 34, color=INK, w=2)
    line(d, 22, 46, 42, 44, color=INK, w=2)
    line(d, 22, 56, 42, 54, color=INK, w=2)
    line(d, 54, 34, 74, 36, color=INK, w=2)
    line(d, 54, 44, 74, 46, color=INK, w=2)
    line(d, 54, 54, 74, 56, color=INK, w=2)
    return img

def draw_music_2():
    """music-2：双音符（乐器一级分类）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 第一个八分音符
    line(d, 32, 18, 32, 64, color=INK, w=4)
    # 符头
    d.ellipse([22, 60, 36, 76], fill=INK)
    # 第二个音符（带横梁）
    line(d, 64, 22, 64, 60, color=INK, w=4)
    d.ellipse([54, 56, 68, 72], fill=INK)
    # 横梁（两旗）
    d.polygon([(32, 18), (64, 14), (64, 26), (32, 30)], fill=INK)
    return img

def draw_smartphone():
    """smartphone：手机（sub: electronics_phone）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 28, 14, 40, 68, color=INK, lw=4, r=4, fill=None)
    line(d, 38, 20, 58, 20, color=INK, w=2)
    line(d, 38, 76, 58, 76, color=INK, w=2)
    return img

def draw_tablet():
    """tablet：平板（sub: electronics_pad）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 20, 18, 56, 60, color=INK, lw=4, r=4, fill=None)
    circle(d, 48, 72, 2, color=INK, lw=0, fill=INK)
    return img

def draw_plug():
    """plug：插头（sub: electronics_acc）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 34, 14, 28, 22, color=INK, lw=4, r=4, fill=None)
    line(d, 42, 14, 42, 8, color=INK, w=3)
    line(d, 54, 14, 54, 8, color=INK, w=3)
    # 下半身梯形
    d.polygon([(28, 40), (68, 40), (60, 60), (36, 60)], outline=INK, width=3, fill=None)
    line(d, 36, 60, 36, 80, color=INK, w=3)
    line(d, 60, 60, 60, 80, color=INK, w=3)
    d.arc([36, 76, 60, 88], 0, 180, fill=INK, width=3)
    return img

def draw_bed():
    """bed：床（sub: daily_life_dorm）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 10, 56, 76, 16, color=INK, lw=4, r=2, fill=None)
    rect(d, 16, 40, 30, 16, color=INK, lw=3, r=4, fill=None)
    # 床头
    line(d, 10, 56, 10, 76, color=INK, w=3)
    line(d, 86, 56, 86, 76, color=INK, w=3)
    return img

def draw_droplet():
    """droplet：水滴（sub: daily_life_bath 美妆/洗护）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 12), (76, 56), (48, 84), (20, 56)],
        outline=ACCENT, width=3, fill=None)
    # 高光
    d.polygon([(38, 50), (44, 44), (48, 60)], fill=WHITE)
    return img

def draw_pencil():
    """pencil：铅笔（sub: daily_life_station 文具/办公）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 笔身
    d.polygon([(20, 76), (60, 36), (74, 50), (34, 90)], outline=INK, width=3, fill=None)
    # 笔尖三角
    d.polygon([(20, 76), (34, 90), (16, 88)], outline=INK, width=3, fill=None)
    # 橡皮头
    d.polygon([(60, 36), (70, 26), (84, 40), (74, 50)], outline=ERROR, width=3, fill=None)
    # 金属箍
    line(d, 56, 40, 70, 54, color=INK, w=2)
    return img

def draw_cookie():
    """cookie：饼干（sub: daily_life_food 零食/食品）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 48, 30, color=INK, lw=4, fill=None)
    # 巧克力豆
    d.ellipse([36, 36, 44, 44], fill=INK)
    d.ellipse([54, 42, 62, 50], fill=INK)
    d.ellipse([38, 56, 46, 64], fill=INK)
    d.ellipse([56, 58, 64, 66], fill=INK)
    return img

def draw_circle_dot():
    """circle-dot：球（sub: sports_ball 球类）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    circle(d, 48, 48, 30, color=INK, lw=4, fill=None)
    d.ellipse([42, 42, 54, 54], fill=INK)
    return img

def draw_mountain():
    """mountain：山（sub: sports_outdoor 户外）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(10, 76), (32, 40), (50, 60), (66, 28), (86, 76)], outline=INK, width=3, fill=None)
    # 雪顶
    d.polygon([(28, 46), (32, 40), (36, 46)], fill=INK)
    d.polygon([(62, 34), (66, 28), (70, 34)], fill=INK)
    # 地平线
    line(d, 10, 76, 86, 76, color=INK, w=3)
    return img

def draw_footprints():
    """footprints：鞋印（sub: apparel_shoe 鞋靴）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.ellipse([22, 16, 40, 40], outline=INK, width=3, fill=None)
    d.ellipse([24, 22, 32, 32], fill=INK)
    d.ellipse([30, 28, 38, 38], fill=INK)
    d.ellipse([56, 50, 74, 74], outline=INK, width=3, fill=None)
    d.ellipse([58, 56, 66, 66], fill=INK)
    d.ellipse([64, 62, 72, 72], fill=INK)
    return img

def draw_briefcase():
    """briefcase：公文包（sub: apparel_bag 箱包）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 提手
    d.arc([36, 14, 60, 32], 180, 360, fill=INK, width=3)
    # 主体
    rect(d, 14, 30, 68, 50, color=INK, lw=4, r=4, fill=None)
    line(d, 14, 48, 82, 48, color=INK, w=3)
    # 锁扣
    rect(d, 42, 44, 12, 6, color=INK, lw=0, fill=INK)
    return img

def draw_watch():
    """watch：手表（sub: apparel_acc 配饰）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 30, 22, 36, 52, color=INK, lw=4, r=6, fill=None)
    circle(d, 48, 48, 12, color=INK, lw=3, fill=None)
    # 表带
    line(d, 36, 22, 36, 14, color=INK, w=3)
    line(d, 60, 22, 60, 14, color=INK, w=3)
    line(d, 36, 74, 36, 82, color=INK, w=3)
    line(d, 60, 74, 60, 82, color=INK, w=3)
    # 指针
    line(d, 48, 48, 48, 40, color=INK, w=2)
    line(d, 48, 48, 54, 48, color=INK, w=2)
    return img

def draw_piano():
    """piano：键盘乐器（sub: musical_key 钢琴）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    rect(d, 14, 28, 68, 48, color=INK, lw=4, r=2, fill=None)
    # 白键分隔
    for x in [28, 42, 56, 70]:
        line(d, x, 28, x, 76, color=INK, w=2)
    # 黑键
    for x in [24, 38, 52, 66]:
        rect(d, x, 28, 6, 18, color=INK, lw=0, fill=INK)
    return img

def draw_wind():
    """wind：管乐器（sub: musical_wind）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 笛身
    rect(d, 20, 38, 60, 14, color=INK, lw=4, r=4, fill=None)
    # 吹孔
    d.ellipse([28, 40, 36, 48], fill=INK)
    d.ellipse([42, 40, 50, 48], fill=INK)
    d.ellipse([56, 40, 64, 48], fill=INK)
    # 尾端
    rect(d, 76, 32, 6, 26, color=INK, lw=3, r=2, fill=None)
    return img

def draw_drum():
    """drum：鼓（sub: musical_perc 打击乐器）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 鼓面（椭圆）
    d.ellipse([16, 26, 80, 50], outline=INK, width=3, fill=None)
    # 鼓身
    line(d, 16, 38, 16, 76, color=INK, w=3)
    line(d, 80, 38, 80, 76, color=INK, w=3)
    d.arc([16, 60, 80, 100], 0, 180, fill=INK, width=3)
    # 鼓身纹路
    line(d, 16, 56, 80, 56, color=INK, w=2)
    # 鼓槌
    line(d, 30, 14, 50, 30, color=INK, w=3)
    d.ellipse([46, 26, 56, 36], fill=INK)
    return img

def draw_languages():
    """languages：语言（sub: textbook_books_lang）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # A
    d.polygon([(20, 70), (32, 24), (44, 70), (38, 70), (36, 60), (28, 60), (26, 70)],
        outline=INK, width=3, fill=None)
    line(d, 30, 50, 34, 50, color=INK, w=2)
    # 文
    rect(d, 50, 30, 24, 40, color=INK, lw=3, r=2, fill=None)
    line(d, 54, 42, 70, 42, color=INK, w=2)
    line(d, 54, 54, 70, 54, color=INK, w=2)
    return img

def draw_file_check():
    """file-check：文件+勾（sub: textbook_books_exam 考试认证）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 折角文档
    d.polygon([(22, 16), (58, 16), (74, 32), (74, 80), (22, 80)], outline=INK, width=3, fill=None)
    d.polygon([(58, 16), (58, 32), (74, 32)], outline=INK, width=3, fill=None)
    # 勾
    d.line([(30, 50), (40, 60), (56, 44)], fill=SUCCESS, width=5)
    # 文字线
    line(d, 28, 68, 56, 68, color=INK, w=2)
    return img

def draw_settings_gear():
    """齿轮设置（sub: musical_acc 乐器配件）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 8 齿
    import math
    cx, cy, r_out, r_in = 48, 48, 30, 22
    pts = []
    for i in range(16):
        r = r_out if i % 2 == 0 else r_in
        a = i * math.pi / 8
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, outline=INK, width=3, fill=None)
    circle(d, 48, 48, 8, color=INK, lw=3, fill=None)
    return img


# ============================================================
# 主入口
# ============================================================

TASKS = [
    # tabbar
    ("tabbar/home.png",         draw_home(active=False)),
    ("tabbar/home-active.png",  draw_home(active=True)),
    ("tabbar/category.png",     draw_category(active=False)),
    ("tabbar/category-active.png", draw_category(active=True)),
    ("tabbar/publish.png",      draw_publish(active=False)),
    ("tabbar/publish-active.png", draw_publish(active=True)),
    ("tabbar/chat.png",         draw_chat(active=False)),
    ("tabbar/chat-active.png",  draw_chat(active=True)),
    ("tabbar/mine.png",         draw_mine(active=False)),
    ("tabbar/mine-active.png",  draw_mine(active=True)),
    # icons - 基础
    ("icons/search.png",        draw_search()),
    ("icons/favorite.png",      draw_favorite(active=False)),
    ("icons/favorite-on.png",   draw_favorite(active=True)),
    ("icons/avatar.png",        draw_avatar()),
    ("icons/image.png",         draw_image()),
    ("icons/empty.png",         draw_empty()),
    ("icons/status-error.png",  draw_status_error()),
    ("icons/status-success.png", draw_status_success()),
    ("icons/status-warning.png", draw_status_warning()),
    ("icons/loading.png",       draw_loading()),
    # icons - 箭头/操作
    ("icons/arrow-left.png",    draw_arrow_left()),
    ("icons/arrow-right.png",   draw_arrow_right()),
    ("icons/arrow-down.png",    draw_arrow_down()),
    ("icons/close.png",         draw_close()),
    ("icons/check.png",         draw_check()),
    ("icons/delete.png",        draw_delete()),
    ("icons/edit.png",          draw_edit()),
    ("icons/share.png",         draw_share()),
    ("icons/plus.png",          draw_plus()),
    ("icons/minus.png",         draw_minus()),
    ("icons/filter.png",        draw_filter()),
    ("icons/refresh.png",       draw_refresh()),
    ("icons/more.png",          draw_more()),
    ("icons/list.png",          draw_list()),
    ("icons/upload.png",        draw_upload()),
    ("icons/download.png",      draw_download()),
    # icons - 媒体
    ("icons/camera.png",        draw_camera()),
    ("icons/camera-plus.png",   draw_camera_plus()),
    ("icons/mic.png",           draw_mic()),
    ("icons/send.png",          draw_send()),
    # icons - 信用/身份
    ("icons/credit.png",        draw_credit()),
    ("icons/award.png",         draw_award()),
    ("icons/badge-check.png",   draw_badge_check()),
    ("icons/user.png",          draw_user()),
    ("icons/users.png",         draw_users()),
    ("icons/user-x.png",        draw_user_x()),
    ("icons/shield.png",        draw_shield()),
    ("icons/school.png",        draw_school()),
    # icons - 业务
    ("icons/ai.png",            draw_ai()),
    ("icons/bell.png",          draw_bell()),
    ("icons/scan.png",          draw_scan()),
    ("icons/qr-code.png",       draw_scan()),  # 复用扫一扫
    ("icons/eye.png",           draw_eye()),
    ("icons/eye-off.png",       draw_eye_off()),
    ("icons/lock.png",          draw_lock()),
    ("icons/wallet.png",        draw_wallet()),
    ("icons/wallet2.png",       draw_wallet2()),
    ("icons/credit-card.png",   draw_credit_card()),
    ("icons/megaphone.png",     draw_megaphone()),
    ("icons/flame.png",         draw_flame()),
    ("icons/chart.png",         draw_chart()),
    ("icons/trending-up.png",   draw_chart()),  # 复用图表
    ("icons/help-circle.png",   draw_help_circle()),
    ("icons/message-square.png",draw_message_square()),
    ("icons/message-circle.png",draw_message_circle()),
    ("icons/headphones.png",    draw_headphones()),
    ("icons/info.png",          draw_info()),
    ("icons/settings.png",      draw_settings()),
    ("icons/log-out.png",       draw_log_out()),
    ("icons/moon.png",          draw_moon()),
    ("icons/globe.png",         draw_globe()),
    ("icons/zap.png",           draw_zap()),
    ("icons/bookmark.png",      draw_bookmark()),
    # icons - 位置/时间
    ("icons/location.png",      draw_location()),
    ("icons/phone.png",         draw_phone()),
    ("icons/clock.png",         draw_clock()),
    # icons - 分类专用
    ("icons/book.png",          draw_book()),
    ("icons/apparel.png",       draw_apparel()),
    ("icons/laptop.png",        draw_laptop()),
    ("icons/bike.png",          draw_bike()),
    ("icons/gift.png",          draw_gift()),
    ("icons/utensils.png",      draw_utensils()),
    ("icons/sofa.png",          draw_sofa()),
    ("icons/dumbbell.png",      draw_dumbbell()),
    ("icons/sparkles.png",      draw_sparkles()),
    ("icons/pet.png",           draw_pet()),
    ("icons/music.png",         draw_music()),
    ("icons/wrench.png",        draw_wrench()),
    ("icons/baby.png",          draw_baby()),
    ("icons/lightbulb.png",     draw_lightbulb()),
    ("icons/package.png",       draw_package()),
    ("icons/shopping-bag.png",  draw_shopping_bag()),
    ("icons/tag.png",           draw_tag()),
    ("icons/grid.png",          draw_grid()),
    ("icons/truck.png",         draw_truck()),
    ("icons/medal.png",         draw_medal()),
    # 后端 init_categories.py 实际使用的 Lucide 短名
    ("icons/book-open.png",     draw_book_open()),
    ("icons/music-2.png",       draw_music_2()),
    ("icons/smartphone.png",    draw_smartphone()),
    ("icons/tablet.png",        draw_tablet()),
    ("icons/plug.png",          draw_plug()),
    ("icons/bed.png",           draw_bed()),
    ("icons/droplet.png",       draw_droplet()),
    ("icons/pencil.png",        draw_pencil()),
    ("icons/cookie.png",        draw_cookie()),
    ("icons/circle-dot.png",    draw_circle_dot()),
    ("icons/mountain.png",      draw_mountain()),
    ("icons/footprints.png",    draw_footprints()),
    ("icons/briefcase.png",     draw_briefcase()),
    ("icons/watch.png",         draw_watch()),
    ("icons/piano.png",         draw_piano()),
    ("icons/wind.png",          draw_wind()),
    ("icons/drum.png",          draw_drum()),
    ("icons/languages.png",     draw_languages()),
    ("icons/file-check.png",    draw_file_check()),
    ("icons/cog.png",           draw_settings_gear()),
]

def main():
    print(f"输出目录: {ASSETS}")
    print(f"将生成 {len(TASKS)} 个 PNG 图标\n")
    for rel, img in TASKS:
        out = os.path.join(ASSETS, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        save_png(img, out)
    print(f"\n完成 {len(TASKS)} 个 PNG")

if __name__ == "__main__":
    main()
