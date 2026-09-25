# ─────────────────────────────────────────────────────────────────────────────
# Frontend Production Dockerfile (Multi-stage Multi-architecture)
# Stage 1: Build static assets using Node 22 Alpine
# Stage 2: Serve minimal, hardened Nginx Alpine image (~25MB total image size)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Cache dependency layer
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Build optimized production bundle
RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove default boilerplate configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom enterprise Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled production bundle from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Hardening: Configure PID and cache directories with appropriate permissions
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html

EXPOSE 80

# Lightweight healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
