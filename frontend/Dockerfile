# Etapa 1 - Build do Vite
FROM node:18-alpine AS build

WORKDIR /app

# Copia apenas os arquivos de dependências
COPY package*.json ./
RUN npm install

# Copia o restante do frontend
COPY . ./

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_BASE_URL

ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL


RUN npm run build

# Etapa 2 - Servir com Nginx
FROM nginx:alpine


# Remove config padrão e adiciona a nossa
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos de build do Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
