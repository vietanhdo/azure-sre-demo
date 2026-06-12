# 1. Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# 2. Production stage (non-root runtime)
FROM nginxinc/nginx-unprivileged:stable-alpine

# Switch to root to place config and site contents, then drop back to non-root
USER root
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
# Ensure ownership for runtime paths
RUN chown -R 101:101 /var/cache/nginx /var/run /var/log/nginx /etc/nginx /usr/share/nginx/html

# Drop privileges
USER 101:101
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
