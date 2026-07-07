"""
家庭资产管理 — Django 配置
对应 docs/02 概要设计、docs/04 数据库设计
"""
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = BASE_DIR / '.env'
if _ENV_FILE.exists():
    load_dotenv(_ENV_FILE)
else:
    load_dotenv(BASE_DIR / '.env.example')  # 仅作兜底；请尽快创建 .env

SECRET_KEY = os.getenv(
    'SECRET_KEY',
    # 默认密钥至少 32 字节（PyJWT 4.x 强制要求 SHA256 推荐长度）。
    # 部署时务必通过环境变量覆盖，避免泄露到代码仓库。
    'dev-secret-key-change-in-production-please-32bytes-minimum',
)
DEBUG = os.getenv('DEBUG', 'True').lower() in ('1', 'true', 'yes')

# ALLOWED_HOSTS 仅支持具体主机名/IP，不支持 192.168.0.0/16 这种 CIDR 写法
_allowed_raw = os.getenv('ALLOWED_HOSTS', '127.0.0.1,localhost')
ALLOWED_HOSTS = [
    h.strip()
    for h in _allowed_raw.split(',')
    if h.strip() and '/' not in h
]
# 本地 DEBUG + 真机同 WiFi：手机请求 Host 为电脑局域网 IP（如 192.168.20.40:8000）
if DEBUG and os.getenv('ALLOW_LAN_IN_DEBUG', 'true').lower() in ('1', 'true', 'yes'):
    ALLOWED_HOSTS = ['*']
elif not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    # 旧版家庭记账业务层（已下线，保留以便回滚参考，对应代码已复制到 finance_legacy/）
    # 'finance',
    # 新版校园二手交易平台业务 App（仅显式注册 AppConfig，避免与默认 short name 重复）
    'market.apps.MarketConfig',
]

# ---------- 自定义用户模型 ----------
# 校园二手交易平台 User 继承 AbstractUser 并自定义 db_table=market_user，
# 必须显式指定 AUTH_USER_MODEL，否则 Django 会同时建 auth_user 与 market_user 两张表冲突。
AUTH_USER_MODEL = 'market.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------- 数据库（默认 MySQL，见 .env） ----------
DB_ENGINE = os.getenv('DB_ENGINE', 'mysql').lower()

if DB_ENGINE == 'mysql':
    _db_password = os.getenv('DB_PASSWORD', '')
    _placeholder = ('', 'your_password')
    if _db_password in _placeholder:
        from django.core.exceptions import ImproperlyConfigured

        raise ImproperlyConfigured(
            'MySQL 密码未配置。请执行: copy .env.example .env\n'
            '然后编辑 .env，将 DB_PASSWORD= 改为本机 MySQL root 的真实密码。\n'
            f'当前读取: DB_PASSWORD={_db_password!r}，.env 存在={_ENV_FILE.exists()}'
        )

    # DB_USE_PYMYSQL=false 时使用已安装的 mysqlclient
    if os.getenv('DB_USE_PYMYSQL', 'true').lower() in ('1', 'true', 'yes'):
        import pymysql

        pymysql.install_as_MySQLdb()

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            # 原库名 family_finance 已下线，现统一使用 campus_market（校园二手交易）
            'NAME': os.getenv('DB_NAME', 'campus_market'),
            'USER': os.getenv('DB_USER', 'root'),
            'PASSWORD': _db_password,
            'HOST': os.getenv('DB_HOST', '127.0.0.1'),
            'PORT': os.getenv('DB_PORT', '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES', time_zone='+08:00'",
            },
        }
    }
elif DB_ENGINE == 'sqlite':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    raise ValueError(f'不支持的 DB_ENGINE: {DB_ENGINE}，请使用 mysql 或 sqlite')

# ---------- CORS（Web 管理后台本地开发） ----------
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'True').lower() in ('1', 'true', 'yes')
CORS_ALLOW_CREDENTIALS = True

# ---------- DRF + JWT ----------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'market.authentication.JWTUserAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'market.pagination.EnvelopePageNumberPagination',
    'PAGE_SIZE': 20,
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
    'DATE_FORMAT': '%Y-%m-%d',
    'EXCEPTION_HANDLER': 'market.exceptions.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ---------- 语音 / LLM ----------
LLM_API_BASE = os.getenv('LLM_API_BASE', 'https://apihub.agnes-ai.com/v1')
LLM_API_KEY = os.getenv('LLM_API_KEY', '')
LLM_MODEL = os.getenv('LLM_MODEL', 'agnes-2.0-flash')
VOICE_LLM_CONFIDENCE_THRESHOLD = float(os.getenv('VOICE_LLM_CONFIDENCE_THRESHOLD', '0.6'))
VOICE_PARSE_RATE = os.getenv('VOICE_PARSE_RATE', '30/minute')
AI_CHAT_RATE = os.getenv('AI_CHAT_RATE', '20/minute')

# ---------- 媒体文件（商品图片 / 头像） ----------
# 商品主图、轮播图、用户头像均通过 ImageField / FileField 上传，
# 实际写入 BASE_DIR / 'media' 子目录；MEDIA_URL 供前端拼接图片地址。
# 注意：生产环境应改用对象存储 (OSS / COS) 并由 Nginx 代理。
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# 允许上传的图片扩展名（可在后续权限类中复用）
ALLOWED_IMAGE_EXTS = {'jpg', 'jpeg', 'png', 'webp', 'gif'}
