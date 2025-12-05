#!/bin/bash
set -e

echo "🚀 Aplicando migrations..."
python manage.py makemigrations --noinput || true
python manage.py migrate --noinput

echo "🔄 Iniciando Gunicorn..."
exec "$@"
