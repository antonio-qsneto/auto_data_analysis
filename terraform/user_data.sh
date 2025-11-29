#!/bin/bash
set -e

echo "============================================"
echo "🚀 XClarity Setup Automático (Ubuntu 22.04 / Debian 12)"
echo "============================================"

# -------------------------------------------------
# 1⃣ Atualizar sistema e instalar dependências
# -------------------------------------------------
echo "[1/5] Atualizando sistema e instalando dependências..."
sudo apt update -y
sudo apt upgrade -y
sudo apt install -y \
    curl \
    wget \
    git \
    apt-transport-https \
    ca-certificates \
    software-properties-common \
    gnupg \
    lsb-release \
    unzip \
    iptables \
    ufw \
    sudo

# -------------------------------------------------
# 2⃣ Instalar Docker CE
# -------------------------------------------------
echo "[2/5] Instalando Docker CE..."
# Adicionar repositório Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar Docker e adicionar usuário ao grupo
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu

echo "[✔] Docker instalado: $(docker --version)"
echo "[✔] Docker Compose (plugin) instalado: $(docker compose version)"

# -------------------------------------------------
# 3⃣ Instalar Certbot (Let's Encrypt)
# -------------------------------------------------
echo "[3/5] Instalando Certbot..."
sudo apt install -y certbot python3-certbot-nginx

DOMAIN="xclarity.duckdns.org"
EMAIL="admin@xclarity.duckdns.org"
echo "[⚙] Gerando certificado SSL para ${DOMAIN}..."
sudo certbot certonly --standalone -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" || true

# Em container (opcional)
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /usr/share/nginx/html:/var/www/html \
  certbot/certbot certonly \
    --webroot -w /var/www/html \
    -d "${DOMAIN}" || true

echo "[✔] Certificados armazenados em /etc/letsencrypt/live/${DOMAIN}/"

# -------------------------------------------------
# 4⃣ Instalar Git
# -------------------------------------------------
echo "[4/5] Verificando Git..."
git --version && echo "[✔] Git instalado: $(git --version)"
