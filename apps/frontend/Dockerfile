# 1. Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# 2. Production stage (non-root)
FROM nginxinc/nginx-unprivileged:stable-alpine
# Copy custom nginx config (listens on 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
USER 101:101
CMD ["nginx", "-g", "daemon off;"]
