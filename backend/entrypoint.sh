#!/bin/bash
set -e

echo "🚀 Aplicando migrations..."
python manage.py makemigrations --noinput || true
python manage.py migrate --noinput

echo "🔥 Iniciando Gunicorn..."
exec gunicorn auto_data_analysis.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 300 \
    --log-level info
