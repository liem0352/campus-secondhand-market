"""
初始化商品分类脚本 — 校园二手交易平台（market）

功能：
    为 market Category 表写入 7 个一级分类 + 若干二级分类：
        1) 教材书籍  textbook_books
        2) 电子产品  electronics
        3) 生活用品  daily_life
        4) 运动器材  sports
        5) 服饰鞋帽  apparel
        6) 乐器      musical
        7) 其它      other

执行方式（PowerShell）：
    1) 先建库 / 迁移（首次）：
         "C:\\Program Files\\MySQL\\MySQL Server 9.4\\bin\\mysql.exe" -u root -ptyb1124 `
             < "d:\\文件\\工作 作业\\微信小程序实训\\4次课程内容\\综合实训\\backend\\scripts\\create_mysql_db.sql"
         C:\\Users\\liem\\AppData\\Local\\Programs\\Python\\Python313\\python.exe manage.py migrate
    2) 跑本脚本（幂等，可重复执行）：
         C:\\Users\\liem\\AppData\\Local\\Programs\\Python\\Python313\\python.exe scripts/init_categories.py

设计要点：
    - 全部走 get_or_create(code=...) ，按 code 判重，重复执行不会破坏已有数据；
    - 一级 code 与规范一致（前端硬编码引用此值），不要随意改动；
    - 二级 code 由 ``<一级 code>_<子分类英文>`` 组成，便于后续按前缀筛选；
    - 图标使用 Lucide 名称字符串（不使用 emoji，符合 UI 规范）。
"""
import os
import sys

import django

# ----- 1) 引导 Django 运行环境 -----
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# ----- 2) 业务导入（必须在 django.setup 之后） -----
from market.models import Category  # noqa: E402


# ---------------------------------------------------------------------------
# 分类配置
# ---------------------------------------------------------------------------
# (code, name, sort_order, lucide_icon)
TOP_CATEGORIES = [
    ('textbook_books', '教材书籍', 1, 'book-open'),
    ('electronics',    '电子产品', 2, 'laptop'),
    ('daily_life',     '生活用品', 3, 'home'),
    ('sports',         '运动器材', 4, 'dumbbell'),
    ('apparel',        '服饰鞋帽', 5, 'shirt'),
    ('musical',        '乐器',     6, 'music-2'),
    ('other',          '其它',     99, 'package'),
]

# { 一级 code: [(sub_code, sub_name, sort_order, lucide_icon), ...] }
SUB_CATEGORIES = {
    'textbook_books': [
        ('textbook_books_uni',  '大学教材',     1, 'book'),
        ('textbook_books_post', '考研资料',     2, 'graduation-cap'),
        ('textbook_books_lang', '语言学习',     3, 'languages'),
        ('textbook_books_exam', '考试认证',     4, 'file-check'),
    ],
    'electronics': [
        ('electronics_phone', '手机',         1, 'smartphone'),
        ('electronics_pc',    '电脑',         2, 'laptop'),
        ('electronics_pad',   '平板',         3, 'tablet'),
        ('electronics_acc',   '数码配件',     4, 'plug'),
        ('electronics_cam',   '相机/摄影',    5, 'camera'),
        ('electronics_audio', '耳机/音箱',    6, 'headphones'),
    ],
    'daily_life': [
        ('daily_life_dorm',   '宿舍用品',     1, 'bed'),
        ('daily_life_kitchen','厨房用品',     2, 'utensils'),
        ('daily_life_bath',   '洗护/美妆',    3, 'droplet'),
        ('daily_life_station','文具/办公',     4, 'pencil'),
        ('daily_life_food',   '零食/食品',    5, 'cookie'),
    ],
    'sports': [
        ('sports_ball',    '球类运动',   1, 'circle-dot'),
        ('sports_fitness', '健身器械',   2, 'dumbbell'),
        ('sports_outdoor', '户外装备',   3, 'mountain'),
        ('sports_cycle',   '骑行装备',   4, 'bike'),
    ],
    'apparel': [
        ('apparel_men',    '男装',   1, 'shirt'),
        ('apparel_women',  '女装',   2, 'shopping-bag'),
        ('apparel_shoe',   '鞋靴',   3, 'footprints'),
        ('apparel_bag',    '箱包',   4, 'briefcase'),
        ('apparel_acc',    '配饰',   5, 'watch'),
    ],
    'musical': [
        ('musical_string',  '弦乐器',   1, 'music-2'),
        ('musical_key',     '键盘乐器', 2, 'piano'),
        ('musical_wind',    '管乐器',   3, 'wind'),
        ('musical_perc',    '打击乐器', 4, 'drum'),
        ('musical_acc',     '乐器配件', 5, 'settings'),
    ],
    'other': [
        ('other_misc', '其他', 1, 'package'),
    ],
}


# ---------------------------------------------------------------------------
# 业务函数
# ---------------------------------------------------------------------------
def create_top_categories():
    """创建一级分类，返回 ``{code: Category}`` 映射。"""
    print('\n========== 创建一级分类 ==========')
    code_map = {}
    for code, name, sort_order, icon in TOP_CATEGORIES:
        cat, created = Category.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'parent': None,
                'sort_order': sort_order,
                'is_active': True,
                'icon': icon,
            },
        )
        code_map[code] = cat
        flag = '创建' if created else '已存在'
        print(f'  [{flag}] {cat.name} ({cat.code})  icon={cat.icon}')
    return code_map


def create_sub_categories(code_map):
    """在已有的一级分类下创建二级分类。"""
    print('\n========== 创建二级分类 ==========')
    for parent_code, subs in SUB_CATEGORIES.items():
        parent = code_map[parent_code]
        for sub_code, sub_name, sort_order, icon in subs:
            cat, created = Category.objects.get_or_create(
                code=sub_code,
                defaults={
                    'name': sub_name,
                    'parent': parent,
                    'sort_order': sort_order,
                    'is_active': True,
                    'icon': icon,
                },
            )
            code_map[sub_code] = cat
            flag = '创建' if created else '已存在'
            print(f'  [{flag}] {parent.name} > {cat.name} ({cat.code})  icon={cat.icon}')


# ---------------------------------------------------------------------------
# 入口
# ---------------------------------------------------------------------------
def main():
    """主流程：一级 → 二级 → 统计。"""
    print('=' * 60)
    print('  校园二手交易平台 — 初始化商品分类')
    print('=' * 60)

    code_map = create_top_categories()
    create_sub_categories(code_map)

    # 统计
    top_count = Category.objects.filter(parent__isnull=True).count()
    sub_count = Category.objects.filter(parent__isnull=False).count()
    print('\n========== 分类初始化完成统计 ==========')
    print(f'  一级分类: {top_count}')
    print(f'  二级分类: {sub_count}')
    print('=' * 60)


if __name__ == '__main__':
    main()
