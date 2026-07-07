"""
初始化管理员账号脚本 — 校园二手交易平台（market）

功能：
    创建 / 更新 market.User 平台管理员账号，使其可用于 Django Admin、
    前后台登录、管理后台视图（IsAdminUser 权限类）。

    用户名默认 ``admin``，密码按以下优先级读取：
        1) 环境变量 ``MARKET_ADMIN_PASSWORD``（推荐：写入 .env 中）
        2) 环境变量 ``DJANGO_ADMIN_PASSWORD``
        3) 命令行参数 ``--password <value>``
        4) 内置默认值 ``admin123``（仅本地开发，请尽快改掉）

执行方式（PowerShell）：
    1) 在 backend/.env 中追加：
         MARKET_ADMIN_USERNAME=admin
         MARKET_ADMIN_PASSWORD=你的强密码
       （可选）然后执行：
         C:\\Users\\liem\\AppData\\Local\\Programs\\Python\\Python313\\python.exe scripts/init_admin.py

    2) 也可临时指定：
         $env:MARKET_ADMIN_PASSWORD='YourStrongPwd'; python scripts/init_admin.py

    3) 也可使用命令行：
         python scripts/init_admin.py --username admin --password YourStrongPwd

设计要点：
    - 幂等：管理员已存在时刷新 role / is_staff / is_superuser / is_active / 密码；
    - 不会触碰其它非管理员账号；
    - 与 init_data_market.py 中的 admin 账号兼容（用户名同为 ``admin``），
      若两边都跑，后跑的会覆盖密码哈希。
"""
import argparse
import os
import sys

import django

# ----- 1) 引导 Django 运行环境 -----
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# 在 django.setup 之前加载 .env，确保 .env 里的 MARKET_ADMIN_PASSWORD 已注入环境变量
try:
    from dotenv import load_dotenv

    _ENV_FILE = os.path.join(BASE, '.env')
    if os.path.exists(_ENV_FILE):
        load_dotenv(_ENV_FILE)
except ImportError:  # 没有 python-dotenv 时跳过
    pass

django.setup()

# ----- 2) 业务导入（必须在 django.setup 之后） -----
from market.models import User  # noqa: E402


# 兜底默认值（仅本地开发使用）
DEFAULT_ADMIN_USERNAME = 'admin'
DEFAULT_ADMIN_PASSWORD = 'admin123'


def _resolve_credentials(args):
    """按优先级解析最终的管理员用户名 / 密码。"""
    username = (
        os.environ.get('MARKET_ADMIN_USERNAME')
        or os.environ.get('DJANGO_ADMIN_USERNAME')
        or args.username
        or DEFAULT_ADMIN_USERNAME
    )
    password = (
        os.environ.get('MARKET_ADMIN_PASSWORD')
        or os.environ.get('DJANGO_ADMIN_PASSWORD')
        or args.password
        or DEFAULT_ADMIN_PASSWORD
    )
    return username, password


def create_or_update_admin(username, password, school='平台运营', student_id=''):
    """创建或刷新管理员账号。返回 ``(user, created)``。"""
    defaults = {
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True,
        'is_active': True,
        'is_certified': True,
        'credit_score': 100,
        'school': school,
        'student_id': student_id,
        'first_name': '管理员',
        'last_name': '',
        'email': f'{username}@campus.local',
    }

    user, created = User.objects.get_or_create(
        username=username,
        defaults=defaults,
    )

    # 已存在时刷新关键字段（role / is_staff / is_superuser / is_active），
    # 保证修复了旧库里的"非管理员 admin"。
    updated = False
    for k, v in defaults.items():
        if getattr(user, k) != v:
            setattr(user, k, v)
            updated = True

    # 密码总是 set_password（写入哈希），不直接对比明文
    user.set_password(password)

    if created or updated:
        user.save()

    return user, created


# ---------------------------------------------------------------------------
# 入口
# ---------------------------------------------------------------------------
def main():
    """主流程：解析参数 → 创建/刷新管理员 → 打印登录信息。"""
    parser = argparse.ArgumentParser(description='初始化/更新校园二手交易平台管理员账号')
    parser.add_argument('--username', help='管理员用户名（默认读取 env 或 admin）')
    parser.add_argument('--password', help='管理员密码（默认读取 env 或 admin123）')
    parser.add_argument('--school', default='平台运营', help='管理员所在学校字段（仅占位）')
    args = parser.parse_args()

    username, password = _resolve_credentials(args)
    source = (
        'env:MARKET_ADMIN_PASSWORD' if os.environ.get('MARKET_ADMIN_PASSWORD')
        else 'env:DJANGO_ADMIN_PASSWORD' if os.environ.get('DJANGO_ADMIN_PASSWORD')
        else 'cli --password' if args.password
        else 'DEFAULT'
    )

    print('=' * 60)
    print('  校园二手交易平台 — 初始化管理员账号')
    print('=' * 60)
    print(f'  用户名: {username}')
    print(f'  密码源: {source}')
    print('=' * 60)

    user, created = create_or_update_admin(
        username=username,
        password=password,
        school=args.school,
    )

    flag = '创建' if created else '已存在并刷新'
    print(f'\n[{flag}] 管理员 {user.username}')
    print(f'  id={user.id}  role={user.role}  is_staff={user.is_staff}  is_superuser={user.is_superuser}')
    print(f'  is_active={user.is_active}  credit_score={user.credit_score}')
    print('\n登录信息（本地开发）：')
    print(f'  管理后台: http://127.0.0.1:8000/admin/  ->  {username} / <密码见上面来源>')
    print(f'  前台管理: http://127.0.0.1:5173/login  ->  {username} / <密码见上面来源>')
    print('=' * 60)

    return 0 if user.is_active and user.is_superuser else 1


if __name__ == '__main__':
    sys.exit(main())
