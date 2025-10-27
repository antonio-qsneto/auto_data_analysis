# ===============================
# 🔹 Etapa 1: Base com dependências
# ===============================
FROM python:3.11-slim AS base

WORKDIR /app

# Variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false

# Instala ferramentas básicas e dependências compiláveis
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copia apenas o requirements.txt para cache
COPY requirements.txt .

# Instala dependências sem cache do pip
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# ===============================
# 🔹 Etapa 2: Código da aplicação
# ===============================
FROM python:3.11-slim AS final

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copia pacotes instalados da etapa base
COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=base /usr/local/bin /usr/local/bin

# Copia o código do backend
COPY . .

# Limpeza final para reduzir tamanho da imagem
RUN find . -name "*.pyc" -delete && \
    rm -rf __pycache__ .pytest_cache .git *.log

# Porta padrão do Gunicorn
EXPOSE 8000

# Comando padrão
CMD ["gunicorn", "auto_data_analysis.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "300", "--log-level", "info"]
