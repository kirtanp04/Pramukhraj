# ─────────────────────────────────────────────────────────────────────────────
# Backend Production Dockerfile (.NET 10 Web API Multi-Stage Build)
# Stage 1: Build & Publish using .NET 10 SDK Alpine
# Stage 2: Run in hardened, minimal .NET 10 ASP.NET Alpine Runtime (~35MB)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS builder

WORKDIR /src

# Copy project manifest first to cache dependency restore layer
COPY pramukhraj.csproj ./
RUN dotnet restore pramukhraj.csproj

# Copy all application source code
COPY . ./

# Publish framework-dependent release build
RUN dotnet publish pramukhraj.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

# ── Stage 2: Hardened Runtime ────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runner

WORKDIR /app

# Security: Run as dedicated non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Copy published artifacts with ownership set to non-root user
COPY --from=builder --chown=appuser:appgroup /app/publish ./

# Create log directory with proper permissions
RUN mkdir -p Logs && chown -R appuser:appgroup Logs

USER appuser

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 8080

# Production Healthcheck against /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "pramukhraj.dll"]
