# Etapa 1 - Build do Vite
FROM node:18-alpine AS build

WORKDIR /app

# Copia apenas os arquivos de dependências
COPY package*.json ./
RUN npm install

# Copia o restante do frontend
COPY . ./
RUN npm run build

# Etapa 2 - Servir com Nginx
FROM nginx:alpine

# Instalar Certbot para HTTPS automático
RUN apk add --no-cache certbot certbot-nginx openssl

# Remove config padrão e adiciona a nossa
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos de build do Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
