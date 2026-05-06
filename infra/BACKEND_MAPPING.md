# Backend Mapping (auto_data_analysis)

## Runtime components identified
- `Django` app (`auto_data_analysis.wsgi`) exposed on port `8000`
- `Gunicorn` process for HTTP API
- `Celery Worker` and optional `Celery Beat`
- `PostgreSQL` as primary relational database (fallback local SQLite in dev)
- `Redis` for cache and broker/result backend of Celery
- `S3` for report artifacts (`Report` model references S3 key/url)
- `CloudFront` as HTTPS entrypoint for the API in production
- `Amplify Hosting` for the production frontend

## Key backend paths
- App settings: `backend/auto_data_analysis/settings.py`
- Main URLs: `backend/auto_data_analysis/urls.py`
- API URLs: `backend/dashboard/urls.py`
- Entrypoint: `backend/entrypoint.sh`
- Container build: `backend/Dockerfile`

## Health endpoint added for LB
- `GET /api/health/` -> `{"status": "ok"}`

## Environment variables expected at runtime
- Core Django:
  - `APP_ENV` (`prod` para produção)
  - `DJANGO_SECRET_KEY`
  - `DJANGO_DEBUG`
  - `DJANGO_ALLOWED_HOSTS`
  - `CORS_ALLOWED_ORIGINS`
  - `FRONTEND_URL`
  - `SECURE_SSL_REDIRECT`
- Database:
  - `POSTGRES_HOST`
  - `POSTGRES_PORT`
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
- Redis/Celery:
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `REDIS_DB`
  - `REDIS_URL`
- Auth/API:
  - `AUTH_MODE` (`cognito` em produção, `local` só para desenvolvimento)
  - `COGNITO_REGION`
  - `COGNITO_USER_POOL_ID`
  - `COGNITO_APP_CLIENT_ID`
  - `COGNITO_ISSUER`
  - `LOCAL_AUTH_JWT_SECRET`
  - `OPENAI_API_KEY`
  - `GOOGLE_API_KEY`
  - `OPENROUTER_API_KEY`
- Reports/S3:
  - `AWS_STORAGE_BUCKET_NAME`
  - `AWS_S3_REGION_NAME`
- Email:
  - `EMAIL_HOST_USER`
  - `EMAIL_HOST_PASSWORD`
