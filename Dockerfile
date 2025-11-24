# Stage 1: Build de la aplicación Angular
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production=false

# Copiar el código fuente
COPY . .

# Construir la aplicación en modo producción
RUN npm run build -- --configuration production

# Stage 2: Servir con Nginx
FROM nginx:alpine

# Copiar los archivos construidos desde el stage anterior
COPY --from=build /app/dist/frontend-gestion/browser /usr/share/nginx/html

# Configurar Nginx para Angular SPA (routing)
RUN echo 'server { \n\
    listen 80; \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html; \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
}' > /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Comando por defecto para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

