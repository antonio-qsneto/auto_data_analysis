# Desenvolvimento Local

Este modo roda o backend em Docker com PostgreSQL e Redis locais, e o frontend
com Vite na máquina. Ele usa `AUTH_MODE=local`, sem Cognito.

## 1. Backend em Docker

Opcionalmente crie ou edite `backend/.env` com chaves de IA antes de subir os
containers. Esse arquivo ja esta ignorado pelo Git.

```bash
GOOGLE_API_KEY=...
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...
```

Suba backend, banco, Redis e worker:

```bash
docker compose -f docker-compose.local.yml up --build
```

Se voce adicionou ou mudou uma chave depois que o backend ja estava rodando,
recrie backend e worker:

```bash
docker compose -f docker-compose.local.yml up -d --force-recreate backend worker
```

API:

```bash
curl http://localhost:8000/api/health/
```

## 2. Frontend Local

Crie o env local do Vite:

```bash
cp frontend/.env.local.example frontend/.env.local
```

Instale dependências e rode:

```bash
cd frontend
npm install
npm run dev
```

Abra:

```text
http://localhost:5173
```

## 3. Login Local

Com `VITE_AUTH_MODE=local`, a tela `/login` mostra e-mail/senha. Use `/signup`
para criar o usuário local no PostgreSQL. Os campos vêm preenchidos com:

```text
demo@example.com
Password123
```

O backend expõe somente para desenvolvimento:

```text
POST /api/auth/local/signup/
POST /api/auth/local/login/
POST /api/auth/local/refresh/
```

Em produção, mantenha `AUTH_MODE=cognito` ou não defina `AUTH_MODE`.

## 4. Resetar Banco Local

```bash
docker compose -f docker-compose.local.yml down -v
```
