# ─────────────────────────────────────────────
# Etapa 1: instalar dependencias con pnpm
# ─────────────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ─────────────────────────────────────────────
# Etapa 2: imagen final
# ─────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copiar código de la aplicación
COPY index.js ./
COPY public ./public

# Puerto que expone Express
EXPOSE 3000

# Variables de entorno con valores por defecto
# (se sobreescriben desde docker-compose o Kubernetes)
ENV NODE_ENV=production
ENV PORT=3000
ENV MONGO_HOST=inventario-db
ENV MYSQL_HOST=ubicacion-db
ENV LDAP_URL=ldap://ldap-service:389

# Usuario no-root (principio de menor privilegio)
USER node

CMD ["node", "index.js"]
