#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重新生成分类图标 —— 使用更鲜明、特征明显的几何形状，
避免之前所有图标都画成"圆角矩形+小矩形"这种类似 play 按钮的视觉。
输出覆盖 miniprogram/assets/icons/ 下的 PNG。
"""
import os
from PIL import Image, ImageDraw

ASSETS = r"d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\miniprogram\assets\icons"
os.makedirs(ASSETS, exist_ok=True)

# 统一画笔色
INK = "#1F2937"     # 深灰近黑
INK_SOFT = "#6B7280"
ACCENT = "#FF6B35"
WHITE = "#FFFFFF"
SIZE = 96


def new_canvas():
    """创建 96x96 透明画布"""
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def save_png(img, name):
    """保存为 PNG"""
    out = os.path.join(ASSETS, name)
    img.convert("RGBA").save(out, "PNG", optimize=True)
    print(f"  OK  {name}")


def thick_line(d, p0, p1, color=INK, w=5):
    """画粗线段"""
    d.line([p0, p1], fill=color, width=w)


def thick_rect(d, box, color=INK, lw=5, fill=None, radius=8):
    """画圆角矩形"""
    if fill is not None:
        d.rounded_rectangle(box, radius=radius, fill=fill)
    d.rounded_rectangle(box, radius=radius, outline=color, width=lw)


# =====================================================================
# 一级分类图标 —— 重点：差异化形状
# =====================================================================

def draw_book_open():
    """教材书籍一级：左右翻开的书（有书脊 + 文字横线）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 左页轮廓
    d.polygon([(12, 24), (48, 20), (48, 80), (12, 76)],
              fill=WHITE, outline=INK)
    # 右页轮廓
    d.polygon([(48, 20), (84, 24), (84, 76), (48, 80)],
              fill=WHITE, outline=INK)
    # 文字线
    for y in (36, 46, 56, 66):
        d.line([(18, y), (42, y - 2)], fill=INK, width=3)
        d.line([(54, y - 2), (78, y)], fill=INK, width=3)
    # 加粗外框
    d.line([(12, 24), (12, 76)], fill=INK, width=4)
    d.line([(84, 24), (84, 76)], fill=INK, width=4)
    return img


def draw_laptop():
    """电子产品一级：笔记本电脑（屏幕 + 底座梯形）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 屏幕外框
    d.rounded_rectangle([16, 18, 80, 64], radius=4, fill=WHITE, outline=INK, width=5)
    # 屏幕内框（显示区域）
    d.rounded_rectangle([22, 24, 74, 58], radius=2, outline=INK_SOFT, width=3)
    # 屏幕内显示一条波形
    thick_line(d, (28, 44), (40, 36), color=INK, w=3)
    thick_line(d, (40, 36), (50, 50), color=INK, w=3)
    thick_line(d, (50, 50), (60, 38), color=INK, w=3)
    thick_line(d, (60, 38), (70, 48), color=INK, w=3)
    # 底座（梯形）
    d.polygon([(8, 64), (88, 64), (80, 78), (16, 78)], fill=INK)
    # 底座凹槽
    d.rounded_rectangle([40, 67, 56, 72], radius=1, fill=WHITE)
    return img


def draw_sofa():
    """生活用品一级：沙发（靠背 + 扶手 + 坐垫）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 靠背
    d.rounded_rectangle([14, 22, 82, 50], radius=10, fill=INK)
    # 坐垫
    d.rounded_rectangle([14, 50, 82, 72], radius=6, fill=WHITE, outline=INK, width=4)
    # 左扶手
    d.rounded_rectangle([8, 38, 22, 76], radius=4, fill=INK)
    # 右扶手
    d.rounded_rectangle([74, 38, 88, 76], radius=4, fill=INK)
    # 坐垫分隔
    d.line([(48, 52), (48, 70)], fill=INK, width=3)
    # 沙发脚
    d.rectangle([14, 74, 22, 82], fill=INK)
    d.rectangle([74, 74, 82, 82], fill=INK)
    return img


def draw_apparel():
    """服饰一级：T恤（衣领 V + 袖子 + 衣身）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 主体梯形
    d.polygon([(20, 28), (38, 18), (58, 18), (76, 28),
               (82, 40), (74, 44), (74, 82), (22, 82), (22, 44),
               (14, 40)], fill=WHITE, outline=INK)
    # 衣领 V
    d.polygon([(38, 18), (48, 36), (58, 18)], fill=WHITE, outline=INK)
    # 袖子线条加粗
    d.line([(20, 28), (14, 40)], fill=INK, width=4)
    d.line([(76, 28), (82, 40)], fill=INK, width=4)
    d.line([(22, 44), (22, 82)], fill=INK, width=4)
    d.line([(74, 44), (74, 82)], fill=INK, width=4)
    d.line([(22, 82), (74, 82)], fill=INK, width=4)
    d.line([(38, 18), (58, 18)], fill=INK, width=4)
    return img


def draw_music_2():
    """乐器一级：双音符（双竖线 + 双符头 + 顶横梁）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 左符干
    d.line([(28, 16), (28, 70)], fill=INK, width=5)
    # 右符干
    d.line([(64, 22), (64, 64)], fill=INK, width=5)
    # 顶横梁（旗）
    d.polygon([(28, 16), (64, 12), (64, 22), (28, 26)], fill=INK)
    # 左符头（实心椭圆）
    d.ellipse([18, 64, 38, 80], fill=INK)
    # 右符头
    d.ellipse([54, 58, 74, 74], fill=INK)
    return img


def draw_dumbbell():
    """运动器材一级：哑铃（中间杆 + 两端大圆）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 中间杆
    d.rectangle([26, 44, 70, 52], fill=INK)
    # 左大圆
    d.ellipse([8, 28, 36, 68], fill=INK)
    # 右大圆
    d.ellipse([60, 28, 88, 68], fill=INK)
    # 左小圆
    d.ellipse([20, 36, 32, 60], fill=WHITE, outline=INK, width=2)
    # 右小圆
    d.ellipse([64, 36, 76, 60], fill=WHITE, outline=INK, width=2)
    return img


def draw_package():
    """其他/兜底一级：包裹盒（立方体 + 十字捆扎带）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 盒盖（顶面）
    d.polygon([(16, 36), (48, 22), (80, 36), (48, 50)], fill=WHITE, outline=INK, width=4)
    # 左面
    d.polygon([(16, 36), (16, 76), (48, 90), (48, 50)], fill=INK_SOFT, outline=INK, width=4)
    # 右面
    d.polygon([(80, 36), (80, 76), (48, 90), (48, 50)], fill=WHITE, outline=INK, width=4)
    # 十字捆扎
    d.line([(48, 22), (48, 90)], fill=INK, width=4)
    d.line([(16, 36), (80, 36)], fill=INK, width=4)
    # 中间节点
    d.rectangle([42, 32, 54, 44], fill=ACCENT, outline=INK, width=2)
    return img


# =====================================================================
# 二级分类图标 —— 同样鲜明特征
# =====================================================================

def draw_book():
    """大学教材二级：单本闭合书（封面 + 书签）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.rounded_rectangle([22, 14, 74, 82], radius=4, fill=WHITE, outline=INK, width=5)
    # 中线（书脊）
    d.line([(30, 14), (30, 82)], fill=INK, width=3)
    # 文字横线
    for y in (28, 38, 48, 58, 68):
        d.line([(38, y), (66, y)], fill=INK_SOFT, width=2)
    # 书签
    d.polygon([(58, 14), (70, 14), (70, 36), (64, 30), (58, 36)], fill=ACCENT)
    return img


def draw_school():
    """毕业帽 / 教程二级：学士帽（方板 + 流苏）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 帽顶（菱形）
    d.polygon([(48, 18), (84, 38), (48, 58), (12, 38)], fill=INK)
    # 帽底（梯形）
    d.rounded_rectangle([24, 50, 72, 64], radius=4, fill=WHITE, outline=INK, width=4)
    # 流苏
    d.line([(78, 40), (84, 70)], fill=INK, width=4)
    d.ellipse([78, 68, 88, 80], fill=ACCENT)
    return img


def draw_phone():
    """手机二级：手机（圆角屏 + 听筒 + home）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.rounded_rectangle([28, 10, 68, 86], radius=8, fill=WHITE, outline=INK, width=5)
    # 听筒
    d.rounded_rectangle([40, 16, 56, 20], radius=2, fill=INK)
    # 屏幕区
    d.rounded_rectangle([32, 24, 64, 74], radius=2, outline=INK_SOFT, width=2)
    # home 键
    d.ellipse([42, 78, 54, 86], fill=WHITE, outline=INK, width=2)
    return img


def draw_smartphone():
    """智能手机二级：与 phone 类似但加刘海/灵动岛"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.rounded_rectangle([26, 8, 70, 88], radius=10, fill=INK)
    d.rounded_rectangle([32, 16, 64, 80], radius=4, fill=WHITE, outline=INK_SOFT, width=2)
    # 灵动岛
    d.rounded_rectangle([42, 19, 54, 25], radius=3, fill=INK)
    # 屏幕图标
    d.line([(36, 36), (60, 36)], fill=INK, width=3)
    d.line([(36, 44), (54, 44)], fill=INK, width=3)
    d.line([(36, 52), (58, 52)], fill=INK, width=3)
    d.line([(36, 60), (50, 60)], fill=INK, width=3)
    return img


def draw_tablet():
    """平板二级：横向大屏"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.rounded_rectangle([10, 22, 86, 74], radius=6, fill=WHITE, outline=INK, width=5)
    d.rounded_rectangle([16, 28, 80, 68], radius=2, outline=INK_SOFT, width=2)
    # home 按键
    d.ellipse([44, 78, 52, 86], fill=WHITE, outline=INK, width=2)
    return img


def draw_plug():
    """插头二级：插头 + 引脚"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.rounded_rectangle([28, 28, 68, 76], radius=10, fill=INK)
    # 引脚
    d.rectangle([36, 18, 42, 30], fill=INK)
    d.rectangle([54, 18, 60, 30], fill=INK)
    # 圆心
    d.ellipse([42, 44, 54, 56], fill=WHITE)
    return img


def draw_camera():
    """相机二级：相机（机身 + 镜头 + 顶凸起）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.rounded_rectangle([12, 30, 84, 78], radius=6, fill=INK)
    # 顶凸起
    d.rounded_rectangle([34, 22, 62, 30], radius=2, fill=INK)
    # 镜头外圈
    d.ellipse([34, 40, 62, 68], fill=WHITE)
    # 镜头内圈
    d.ellipse([40, 46, 56, 62], fill=INK)
    # 闪光灯
    d.ellipse([68, 36, 78, 46], fill=WHITE)
    return img


def draw_headphones():
    """耳机二级：耳机头梁 + 两耳罩"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 头梁
    d.arc([14, 14, 82, 70], start=180, end=360, fill=INK, width=6)
    # 左耳罩
    d.rounded_rectangle([10, 50, 30, 84], radius=6, fill=INK)
    # 右耳罩
    d.rounded_rectangle([66, 50, 86, 84], radius=6, fill=INK)
    return img


def draw_bed():
    """床二级：床头 + 床垫 + 枕头"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 床头板
    d.rounded_rectangle([10, 16, 22, 78], radius=4, fill=INK)
    # 床垫
    d.rounded_rectangle([22, 50, 86, 78], radius=6, fill=WHITE, outline=INK, width=5)
    # 枕头
    d.rounded_rectangle([28, 36, 56, 52], radius=4, fill=INK_SOFT, outline=INK, width=3)
    # 床腿
    d.rectangle([12, 78, 20, 86], fill=INK)
    d.rectangle([78, 78, 86, 86], fill=INK)
    return img


def draw_utensils():
    """餐具二级：刀 + 叉"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 叉
    d.rectangle([26, 14, 30, 82], fill=INK)
    d.polygon([(18, 14), (38, 14), (30, 30)], fill=INK)
    d.line([(20, 20), (20, 32)], fill=INK, width=3)
    d.line([(36, 20), (36, 32)], fill=INK, width=3)
    # 刀
    d.polygon([(66, 14), (70, 14), (74, 50), (70, 82), (66, 82), (62, 50)],
              fill=INK)
    return img


def draw_droplet():
    """水滴二级：水滴（带高光）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.polygon([(48, 12), (76, 56), (60, 84), (36, 84), (20, 56)],
              fill=INK)
    # 高光
    d.polygon([(36, 40), (44, 40), (32, 64), (24, 64)], fill=WHITE)
    return img


def draw_pencil():
    """铅笔二级：笔身 + 笔尖 + 橡皮"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 橡皮（顶部）
    d.polygon([(20, 10), (40, 10), (40, 22), (20, 22)], fill=ACCENT)
    # 金属箍
    d.rectangle([18, 22, 42, 28], fill=INK_SOFT)
    # 笔身
    d.polygon([(22, 28), (38, 28), (44, 76), (16, 76)], fill=INK)
    # 笔尖
    d.polygon([(16, 76), (44, 76), (30, 90)], fill=WHITE, outline=INK)
    return img


def draw_cookie():
    """饼干二级：圆形饼干 + 巧克力豆"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.ellipse([10, 10, 86, 86], fill="#C28A4F", outline=INK, width=4)
    # 巧克力豆
    for cx, cy in [(32, 36), (58, 32), (44, 56), (66, 60), (30, 64)]:
        d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill="#3B2417")
    return img


def draw_circle_dot():
    """球类二级：篮球（圆 + 内弧线）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.ellipse([10, 10, 86, 86], fill="#E07B3C", outline=INK, width=5)
    # 中间竖线
    d.line([(48, 10), (48, 86)], fill=INK, width=4)
    # 中间横线
    d.line([(10, 48), (86, 48)], fill=INK, width=4)
    # 弧线（左）
    d.arc([18, 18, 78, 78], start=270, end=90, fill=INK, width=4)
    # 弧线（右）
    d.arc([18, 18, 78, 78], start=90, end=270, fill=INK, width=4)
    return img


def draw_mountain():
    """户外二级：山 + 太阳"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 太阳
    d.ellipse([60, 14, 84, 38], fill=ACCENT)
    # 后山
    d.polygon([(8, 76), (36, 32), (60, 76)], fill=INK_SOFT, outline=INK)
    # 前山
    d.polygon([(28, 82), (58, 38), (88, 82)], fill=INK, outline=INK)
    return img


def draw_bike():
    """自行车二级：两个轮 + 车架 + 把手 + 座椅"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 左轮
    d.ellipse([6, 44, 42, 80], outline=INK, width=5)
    # 右轮
    d.ellipse([54, 44, 90, 80], outline=INK, width=5)
    # 车架三角
    d.line([(24, 62), (48, 28)], fill=INK, width=5)
    d.line([(48, 28), (72, 62)], fill=INK, width=5)
    d.line([(24, 62), (72, 62)], fill=INK, width=5)
    # 车把
    d.line([(70, 60), (82, 30), (88, 30)], fill=INK, width=5)
    # 座椅
    d.line([(36, 30), (52, 30)], fill=INK, width=5)
    return img


def draw_shopping_bag():
    """箱包二级：手提袋（提手 + 袋身）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 提手
    d.arc([28, 14, 68, 50], start=180, end=360, fill=INK, width=5)
    # 袋身
    d.rounded_rectangle([16, 38, 80, 84], radius=4, fill=INK)
    # 高光
    d.rounded_rectangle([22, 44, 36, 78], radius=2, fill=INK_SOFT)
    return img


def draw_footprints():
    """鞋二级：鞋印"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 左脚印
    d.ellipse([14, 50, 36, 84], fill=INK)
    for i, (cx, cy) in enumerate([(20, 38), (26, 30), (32, 26), (38, 28)]):
        d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=INK)
    # 右脚印
    d.ellipse([58, 14, 80, 48], fill=INK)
    for i, (cx, cy) in enumerate([(60, 64), (66, 56), (72, 52), (78, 54)]):
        d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=INK)
    return img


def draw_briefcase():
    """公文包二级：箱体 + 提手 + 锁扣"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 提手
    d.arc([36, 10, 60, 30], start=180, end=360, fill=INK, width=5)
    # 箱体
    d.rounded_rectangle([12, 28, 84, 80], radius=4, fill=INK)
    # 锁扣
    d.rounded_rectangle([42, 50, 54, 60], radius=1, fill=WHITE)
    # 分隔线
    d.line([(12, 46), (84, 46)], fill=WHITE, width=2)
    return img


def draw_watch():
    """配饰二级：手表（表盘 + 表带）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 上表带
    d.polygon([(38, 6), (58, 6), (54, 24), (42, 24)], fill=INK)
    # 下表带
    d.polygon([(42, 72), (54, 72), (58, 90), (38, 90)], fill=INK)
    # 表盘
    d.ellipse([20, 22, 76, 78], fill=WHITE, outline=INK, width=5)
    # 指针
    d.line([(48, 48), (48, 32)], fill=INK, width=3)  # 时针
    d.line([(48, 48), (62, 52)], fill=INK, width=3)  # 分针
    d.ellipse([45, 45, 51, 51], fill=INK)
    return img


def draw_piano():
    """键盘乐器二级：钢琴（白键 + 黑键）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 主体
    d.rounded_rectangle([10, 18, 86, 78], radius=4, fill=INK)
    # 白键
    for i in range(7):
        x = 14 + i * 10
        d.rectangle([x, 28, x + 8, 76], fill=WHITE, outline=INK, width=1)
    # 黑键
    for i in [1, 2, 4, 5, 6]:
        x = 14 + i * 10 - 3
        d.rectangle([x, 28, x + 6, 50], fill=INK)
    return img


def draw_wind():
    """管乐二级：萨克斯风（弯管 + 喇叭）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 弯管
    d.line([(48, 12), (48, 48)], fill=INK, width=8)
    d.line([(48, 48), (28, 68)], fill=INK, width=8)
    # 喇叭（大口）
    d.polygon([(28, 68), (8, 86), (16, 88), (40, 76)], fill=INK)
    # 吹嘴
    d.ellipse([44, 6, 52, 18], fill=INK)
    # 按键点
    d.ellipse([44, 30, 52, 38], fill=ACCENT)
    return img


def draw_drum():
    """打击乐二级：鼓（鼓面 + 鼓身 + 鼓棒）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 鼓面
    d.ellipse([20, 30, 76, 50], fill="#E0E0E0", outline=INK, width=4)
    # 鼓身
    d.polygon([(20, 36), (20, 78), (76, 78), (76, 36)], fill=ACCENT, outline=INK, width=4)
    # 鼓身底圈
    d.ellipse([20, 70, 76, 86], fill=INK_SOFT, outline=INK, width=3)
    # 鼓棒
    d.line([(10, 14), (40, 50)], fill=INK, width=4)
    d.line([(86, 14), (56, 50)], fill=INK, width=4)
    return img


def draw_languages():
    """语言二级：对话气泡（地球 + 文字）"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    d.ellipse([14, 14, 82, 82], fill=INK)
    # 内部椭圆
    d.ellipse([26, 26, 70, 70], fill=WHITE, outline=WHITE, width=2)
    # 经线
    d.line([(48, 26), (48, 70)], fill=INK, width=2)
    # 纬线
    d.line([(26, 48), (70, 48)], fill=INK, width=2)
    # 气泡尾巴
    d.polygon([(70, 70), (84, 86), (60, 78)], fill=INK)
    return img


def draw_file_check():
    """考试二级：文件 + 勾"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 文件主体
    d.polygon([(24, 12), (60, 12), (76, 28), (76, 84), (24, 84)],
              fill=WHITE, outline=INK)
    # 折角
    d.polygon([(60, 12), (60, 28), (76, 28)], fill=INK_SOFT, outline=INK)
    # 文字线
    for y in (38, 48, 58):
        d.line([(32, y), (66, y)], fill=INK_SOFT, width=2)
    # 勾
    d.line([(34, 68), (44, 76), (62, 60)], fill=ACCENT, width=6)
    return img


def draw_settings_gear():
    """设置 / 配件二级：齿轮"""
    img = new_canvas(); d = ImageDraw.Draw(img)
    # 8 个齿
    cx, cy = 48, 48
    for i in range(8):
        ang = i * 45
        rad = ang * 3.14159 / 180
        x1 = cx + 26 * (1 if i % 2 == 0 else 0.8) * 0  # placeholder
        # 直接画齿：用矩形旋转
        d.rectangle([cx - 6, cy - 40, cx + 6, cy - 26], fill=INK)
    # 中心圆
    d.ellipse([22, 22, 74, 74], fill=INK)
    d.ellipse([34, 34, 62, 62], fill=WHITE, outline=INK, width=2)
    return img


# =====================================================================
# 执行
# =====================================================================

TASKS = [
    # 一级分类
    ("book-open.png",     draw_book_open()),
    ("laptop.png",        draw_laptop()),
    ("sofa.png",          draw_sofa()),
    ("apparel.png",       draw_apparel()),
    ("music-2.png",       draw_music_2()),
    ("dumbbell.png",      draw_dumbbell()),
    ("package.png",       draw_package()),
    # 二级分类
    ("book.png",          draw_book()),
    ("school.png",        draw_school()),
    ("phone.png",         draw_phone()),
    ("smartphone.png",    draw_smartphone()),
    ("tablet.png",        draw_tablet()),
    ("plug.png",          draw_plug()),
    ("camera.png",        draw_camera()),
    ("headphones.png",    draw_headphones()),
    ("bed.png",           draw_bed()),
    ("utensils.png",      draw_utensils()),
    ("droplet.png",       draw_droplet()),
    ("pencil.png",        draw_pencil()),
    ("cookie.png",        draw_cookie()),
    ("circle-dot.png",    draw_circle_dot()),
    ("mountain.png",      draw_mountain()),
    ("bike.png",          draw_bike()),
    ("shopping-bag.png",  draw_shopping_bag()),
    ("footprints.png",    draw_footprints()),
    ("briefcase.png",     draw_briefcase()),
    ("watch.png",         draw_watch()),
    ("piano.png",         draw_piano()),
    ("wind.png",          draw_wind()),
    ("drum.png",          draw_drum()),
    ("languages.png",     draw_languages()),
    ("file-check.png",    draw_file_check()),
    ("cog.png",           draw_settings_gear()),
]


if __name__ == "__main__":
    print("=== 重新生成分类图标 ===")
    for name, img in TASKS:
        save_png(img, name)
    print(f"\n已完成 {len(TASKS)} 个图标")
