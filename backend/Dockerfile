# ===============================
# 🔹 Etapa 1: Base com dependências
# ===============================
FROM python:3.11-slim AS base

WORKDIR /app

# Variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false

# Instala ferramentas necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copia apenas requirements.txt para cache de dependências
COPY requirements.txt .

# Instala dependências
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt


# ===============================
# 🔹 Etapa 2: Imagem final
# ===============================
FROM python:3.11-slim AS final

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copia libs instaladas
COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=base /usr/local/bin /usr/local/bin

# Copia o código da aplicação
COPY . .

# Copia o entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Limpa caches
RUN find . -name "*.pyc" -delete && \
    rm -rf __pycache__ .pytest_cache .git *.log

# Porta do Gunicorn
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["gunicorn", "auto_data_analysis.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "300", "--log-level", "info"]
