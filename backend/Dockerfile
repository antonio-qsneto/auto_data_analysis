# ===============================
# 🔹 Etapa 1: Instalação de dependências
# ===============================
FROM python:3.11-slim AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VIRTUALENVS_CREATE=false

# Instala ferramentas básicas e dependências compiláveis
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia apenas as dependências para cache
COPY requirements.txt .

# Instala dependências e limpa cache do pip imediatamente
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge

# ===============================
# 🔹 Etapa 2: Código da aplicação
# ===============================
FROM python:3.11-slim AS final

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copia apenas os pacotes instalados da etapa base
COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=base /usr/local/bin /usr/local/bin

# Copia o código da aplicação
COPY . .

# Limpeza final para reduzir tamanho
RUN find . -name "*.pyc" -delete && \
    rm -rf __pycache__ .pytest_cache .git *.log

EXPOSE 8000

CMD ["gunicorn", "auto_data_analysis.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "300"]
