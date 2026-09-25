# Pramukhraj Foods — Docker Architecture & Deployment Guide

This directory manages the enterprise Docker containerization for the Pramukhraj Foods full-stack platform:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: ASP.NET Core (.NET 10 Web API)
- **Database**: PostgreSQL 16 Alpine

---

## 🚀 Key Features

1. **Lightweight & Smaller Sized Images**:
   - Uses **Alpine Linux** base images for all services (`node:22-alpine`, `mcr.microsoft.com/dotnet/aspnet:10.0-preview-alpine`, `nginx:alpine`, `postgres:16-alpine`).
   - Production images use **multi-stage builds**, dropping build tools, SDKs, and compilers from final runtime containers.

2. **Instant Hot-Reloading Without Container Restarts**:
   - **Frontend (UI)**: Powered by Vite Hot Module Replacement (HMR) with bind mount and `usePolling: true`. Any change to UI components, styles, or assets instantly syncs to the browser in milliseconds without restarting Docker.
   - **Backend (API)**: Powered by `dotnet watch run` with `DOTNET_USE_POLLING_FILE_WATCHER=1` and live source bind mounting. Modifying any `.cs` file or controller triggers hot reload/incremental compilation on the fly inside the container in 1–2 seconds without restarting the container.
   - **Host isolation**: Linux-specific `node_modules` and .NET `bin`/`obj` directories are isolated via anonymous volumes so host Windows files never collide with Linux binaries.

3. **Enterprise Security & Hardening**:
   - Production backend runs as a non-privileged `appuser` (non-root).
   - Production frontend runs Nginx with strict security headers (`X-Frame-Options`, `X-XSS-Protection`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`) and automated gzip compression.
   - Production database binds strictly to localhost loopback (`127.0.0.1:5432`) to prevent unauthorized internet exposure.

---

## 🛠️ Development Mode (With Live Hot-Reloading)

Navigate to the `docker/` folder:

```bash
cd D:\Pramukhraj\docker
```

### Start Development Stack
```bash
# Using npm
npm run dev

# Or in background detached mode
npm run dev:d

# Or directly with Docker Compose
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
```

### Dev Endpoints
- **Frontend UI**: `http://localhost:5173`
- **Backend API**: `http://localhost:5204` (Internal container port `8080`)
- **API Health Check**: `http://localhost:5204/health`
- **PostgreSQL Database**: `localhost:5433` (User: `postgres`, DB: `pramukhraj_db`)

### View Logs
```bash
npm run dev:logs
```

### Stop Development Stack
```bash
npm run dev:down
```

---

## 🏭 Production Mode (Optimized & Minimal Footprint)

### 1. Configure Production Secrets
Ensure all passwords and secrets in `docker/.env.prod` are set before deployment.

### 2. Build Production Images
```bash
npm run prod:build
# Or
docker compose --env-file .env.prod -f docker-compose.prod.yml build
```

### 3. Start Production Stack
```bash
npm run prod:up
# Or
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

### 4. Stop Production Stack
```bash
npm run prod:down
```

In production, Nginx serves the optimized SPA on port `80` (or configured port) and automatically reverse-proxies `/api/` requests to the internal backend container (`http://backend-prod:8080/api/`), eliminating CORS issues completely.
