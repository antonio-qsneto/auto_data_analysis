from pathlib import Path
from dotenv import load_dotenv  # type: ignore
import os

# ===========================
# ⚙️ Inicialização básica
# ===========================
load_dotenv()
BASE_DIR = Path(__file__).resolve().parent.parent

# ===========================
# 🔐 Segurança
# ===========================
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "fallback-secret-key")
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes")

ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]

# ===========================
# 🌐 CORS / CSRF
# ===========================
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://frontend,http://localhost,https://ec2-13-217-233-112.compute-1.amazonaws.com",
    ).split(",")
    if o.strip()
]
CORS_ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS", "True").lower() in ("1", "true", "yes")
CSRF_TRUSTED_ORIGINS = [origin for origin in CORS_ALLOWED_ORIGINS]

# ===========================
# 📦 Apps instalados
# ===========================
INSTALLED_APPS = [
    # Django padrão
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # REST
    'rest_framework',

    # Outras apps
    'corsheaders',
    'dashboard',
    'widget_tweaks',
    'storages',
]

# ===========================
# 🧱 Middleware
# ===========================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'auto_data_analysis.urls'

# ===========================
# 🧩 Templates
# ===========================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "dashboard/templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'auto_data_analysis.wsgi.application'

# ===========================
# 🗄️ Banco de dados (PostgreSQL ou SQLite)
# ===========================

POSTGRES_REQUIRED_VARS = ["POSTGRES_HOST", "POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD"]

if all(os.getenv(v) for v in POSTGRES_REQUIRED_VARS):
    # PostgreSQL
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB"),
            "USER": os.getenv("POSTGRES_USER"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
            "HOST": os.getenv("POSTGRES_HOST"),
            "PORT": int(os.getenv("POSTGRES_PORT", 5432)),
        }
    }
else:
    # SQLite fallback
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# ===========================
# 🔑 Validação de senhas
# ===========================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ===========================
# 🌎 Internacionalização
# ===========================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ===========================
# 📁 Arquivos estáticos
# ===========================
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===========================
# 👤 Autenticação / AWS Cognito
# ===========================
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

LOGIN_REDIRECT_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
LOGOUT_REDIRECT_URL = os.getenv("FRONTEND_URL", "http://localhost:5173") + "/"

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

COGNITO_REGION = os.getenv("COGNITO_REGION", os.getenv("AWS_REGION", "us-east-1"))
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "")
COGNITO_ISSUER = os.getenv(
    "COGNITO_ISSUER",
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
    if COGNITO_USER_POOL_ID
    else "",
)
COGNITO_JWKS_URL = (
    f"{COGNITO_ISSUER}/.well-known/jwks.json"
    if COGNITO_ISSUER
    else ""
)
AUTH_MODE = os.getenv("AUTH_MODE", "cognito").strip().lower()
LOCAL_AUTH_JWT_SECRET = os.getenv("LOCAL_AUTH_JWT_SECRET", SECRET_KEY)
LOCAL_AUTH_ACCESS_MINUTES = int(os.getenv("LOCAL_AUTH_ACCESS_MINUTES", "60"))
LOCAL_AUTH_REFRESH_DAYS = int(os.getenv("LOCAL_AUTH_REFRESH_DAYS", "7"))

# ===========================
# 🔒 Django REST + Cognito JWT
# ===========================
DEFAULT_AUTHENTICATION_CLASS = (
    "dashboard.authentication.LocalJWTAuthentication"
    if AUTH_MODE == "local"
    else "dashboard.authentication.CognitoJWTAuthentication"
)

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        DEFAULT_AUTHENTICATION_CLASS,
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# ===========================
# ☁️ AWS / S3
# ===========================
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
LOCAL_REPORTS_ROOT = os.getenv("LOCAL_REPORTS_ROOT", str(BASE_DIR / "local_reports"))
if AWS_STORAGE_BUCKET_NAME:
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", "sa-east-1")
    AWS_S3_SIGNATURE_VERSION = os.getenv("AWS_S3_SIGNATURE_VERSION", "s3v4")
    AWS_DEFAULT_ACL = os.getenv("AWS_DEFAULT_ACL", "private")
    AWS_QUERYSTRING_AUTH = os.getenv("AWS_QUERYSTRING_AUTH", "False").lower() in ("1", "true", "yes")

    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
            "OPTIONS": {"bucket_name": AWS_STORAGE_BUCKET_NAME},
        },
        "staticfiles": {
            "BACKEND": "storages.backends.s3boto3.S3StaticStorage"
            if os.getenv("USE_S3_FOR_STATIC", "False").lower() in ("1", "true")
            else "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
else:
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }

# ===========================
# 📧 E-mail
# ===========================
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() in ("1", "true", "yes")
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)

# ===========================
# ⚙️ Modelos / Logging
# ===========================
AUTH_USER_MODEL = "dashboard.CustomUser"

LOG_LEVEL = os.getenv("DJANGO_LOG_LEVEL", "INFO")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
}

# ===========================
# 🧱 Segurança (produção)
# ===========================
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    USE_X_FORWARDED_HOST = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True").lower() in ("1", "true", "yes")
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", 60))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("SECURE_HSTS_INCLUDE_SUBDOMAINS", "True").lower() in ("1", "true", "yes")
    SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "False").lower() in ("1", "true", "yes")


# Celery / Redis
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_URL = os.getenv("REDIS_URL", f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}")

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 60 * 20  # 20 minutos por segurança


CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "TIMEOUT": 60 * 60,  # 1 hora de persistência
    }
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
}
