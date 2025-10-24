# ===============================
# 🔹 Etapa 1: Build limpo e isolado (usa wheels para isolamento)
# ===============================
FROM python:3.11-slim AS builder

WORKDIR /install

# Variáveis básicas
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 🔹 Flags para otimização de tamanho (strip debug, optimize for size)
ENV CFLAGS="-Os -g0" \
    LDFLAGS="-Wl,--strip-all"

COPY requirements.txt .

# Usa pip wheel para criar wheels isolados (mais eficiente que --prefix)
RUN pip wheel --wheel-dir /wheels -r requirements.txt --no-cache-dir


# ===============================
# 🔹 Etapa 2: Imagem final (limpa e mínima)
# ===============================
FROM python:3.11-slim

WORKDIR /app

# Variáveis básicas
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copiar wheels do builder
COPY --from=builder /wheels /wheels

# Copiar requirements para esta etapa (necessário para -r)
COPY requirements.txt .

# Instala de wheels locais (rápido, sem cache, sem compilação extra)
RUN pip install --no-index --find-links /wheels -r requirements.txt --no-cache-dir && \
    rm -rf /wheels  # Limpa wheels após install

# Copiar código-fonte (agora menor graças ao .dockerignore)
COPY . .

# Remover arquivos inúteis (expande para mais caches)
RUN find . -name "*.pyc" -delete && \
    rm -rf __pycache__ .pytest_cache .git *.log && \
    #python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["gunicorn", "auto_data_analysis.wsgi:application", "--bind", "0.0.0.0:8000"]