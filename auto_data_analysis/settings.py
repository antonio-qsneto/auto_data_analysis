from pathlib import Path
from dotenv import load_dotenv  # type: ignore
import os
from datetime import timedelta

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "fallback-secret-key")
DEBUG = True
ALLOWED_HOSTS = []

# Site & CORS
SITE_ID = 1
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# Aplicativos instalados
INSTALLED_APPS = [
    # Padrão Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    # REST e Autenticação
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'dj_rest_auth',
    'dj_rest_auth.registration',

    # Social Auth
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',

    # Outras apps
    'corsheaders',
    'dashboard',
    'widget_tweaks',
    'storages',
]

# Middleware configurado corretamente
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',  # necessário para allauth :contentReference[oaicite:0]{index=0}
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'auto_data_analysis.urls'

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

# Banco de dados (SQLite para desenvolvimento)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Validadores de senha padrão
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Allauth configuration
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_USERNAME_REQUIRED = False
LOGIN_REDIRECT_URL = 'http://localhost:5173'
LOGOUT_REDIRECT_URL = 'http://localhost:5173/'

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': os.getenv("GOOGLE_CLIENT_ID"),
            'secret': os.getenv("GOOGLE_CLIENT_SECRET"),
        },
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'OAUTH_PKCE_ENABLED': True,
    }
}

# Django REST Framework com SimpleJWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}


# Configurações de JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.getenv('JWT_SECRET_KEY'),
}

# Opções de armazenamento na S3
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", "sa-east-1")
AWS_DEFAULT_ACL = "private"
AWS_QUERYSTRING_AUTH = False

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        "OPTIONS": {"bucket_name": AWS_STORAGE_BUCKET_NAME},
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

AUTH_USER_MODEL = "dashboard.CustomUser"
