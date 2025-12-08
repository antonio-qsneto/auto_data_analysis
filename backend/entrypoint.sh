#!/bin/bash
set -e

echo "🚀 Aplicando migrations..."
python manage.py makemigrations --noinput || true
python manage.py migrate --noinput

if [ "$1" = "celery" ]; then
    echo "🐍 Iniciando Celery Worker..."
    exec celery -A auto_data_analysis worker --loglevel=INFO
elif [ "$1" = "celery-beat" ]; then
    echo "⏰ Iniciando Celery Beat..."
    exec celery -A auto_data_analysis beat --loglevel=INFO
else
    echo "🔥 Iniciando Gunicorn..."
    exec gunicorn auto_data_analysis.wsgi:application \
        --bind 0.0.0.0:8000 \
        --workers 3 \
        --timeout 300 \
        --log-level info
fi
