# ============================================================
# SeguriTurno — Frontend Dockerfile (multi-stage)
# ============================================================

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Args para variables de entorno en tiempo de build
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_NAME=SeguriTurno
ARG REACT_APP_VERSION=2.0.0

ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL \
    REACT_APP_NAME=$REACT_APP_NAME \
    REACT_APP_VERSION=$REACT_APP_VERSION

# Instalar dependencias
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Build de producción
COPY . .
RUN yarn build

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/build /usr/share/nginx/html

# Configuración de Nginx para SPA (React Router)
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:8001; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
