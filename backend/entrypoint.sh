#!/bin/sh
set -e

APP_ROLE="${1:-web}"

if [ "$APP_ROLE" = "web" ]; then
    if [ "${MIGRATE_ON_START:-true}" = "true" ]; then
        echo "Applying migrations..."
        python manage.py migrate --noinput
    fi

    if [ "${COLLECTSTATIC_ON_START:-true}" = "true" ]; then
        echo "Collecting static files..."
        python manage.py collectstatic --noinput
    fi

    echo "Starting Gunicorn..."
    exec gunicorn auto_data_analysis.wsgi:application \
        --bind 0.0.0.0:8000 \
        --workers "${GUNICORN_WORKERS:-3}" \
        --timeout "${GUNICORN_TIMEOUT:-300}" \
        --log-level "${GUNICORN_LOG_LEVEL:-info}"
fi

if [ "$APP_ROLE" = "worker" ] || [ "$APP_ROLE" = "celery" ]; then
    echo "Starting Celery worker..."
    exec celery -A auto_data_analysis worker --loglevel="${CELERY_LOG_LEVEL:-INFO}"
fi

if [ "$APP_ROLE" = "beat" ] || [ "$APP_ROLE" = "celery-beat" ]; then
    echo "Starting Celery beat..."
    exec celery -A auto_data_analysis beat --loglevel="${CELERY_LOG_LEVEL:-INFO}"
fi

echo "Unknown APP_ROLE: $APP_ROLE. Use web, worker/celery or beat/celery-beat."
exit 1
