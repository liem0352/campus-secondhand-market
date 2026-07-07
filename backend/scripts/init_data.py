"""
初始化数据：python manage.py shell < scripts/init_data.py
或: python scripts/init_data.py（需先 migrate）
"""
import os
import sys

import django

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from finance.models import Category, User  # noqa: E402
from finance.models_voice import CategoryKeyword  # noqa: E402

CATEGORIES = [
    ('餐饮', '🍽️', 'expense', 1),
    ('交通', '🚗', 'expense', 2),
    ('购物', '🛒', 'expense', 3),
    ('娱乐', '🎮', 'expense', 4),
    ('住房', '🏠', 'expense', 5),
    ('医疗', '💊', 'expense', 6),
    ('教育', '📚', 'expense', 7),
    ('其他支出', '💸', 'expense', 99),
    ('工资', '💰', 'income', 1),
    ('奖金', '🎁', 'income', 2),
    ('其他收入', '📥', 'income', 99),
]

KEYWORDS = {
    '餐饮': ['吃饭', '午餐', '晚餐', '外卖', '奶茶'],
    '交通': ['打车', '地铁', '公交', '加油'],
    '购物': ['超市', '淘宝', '京东'],
    '娱乐': ['电影', '游戏'],
    '住房': ['房租', '水电'],
    '医疗': ['医院', '药'],
    '教育': ['学费', '培训'],
    '工资': ['工资', '薪水'],
    '奖金': ['奖金', '年终奖'],
}


def main():
    if not User.objects.filter(username='admin').exists():
        admin = User(username='admin', nickname='管理员', role=User.ROLE_ADMIN)
        admin.set_password('admin123')
        admin.save()
        print('创建管理员 admin / admin123')

    if not User.objects.filter(username='zhangsan').exists():
        m = User(username='zhangsan', nickname='张三', role=User.ROLE_MEMBER)
        m.set_password('123456')
        m.save()
        print('创建成员 zhangsan / 123456')

    for name, icon, ctype, order in CATEGORIES:
        cat, _ = Category.objects.get_or_create(
            name=name,
            defaults={'icon': icon, 'type': ctype, 'sort_order': order, 'is_system': True},
        )
        for kw in KEYWORDS.get(name, []):
            CategoryKeyword.objects.get_or_create(
                category=cat, keyword=kw, defaults={'weight': 10}
            )

    print('分类与关键词初始化完成')


if __name__ == '__main__':
    main()
