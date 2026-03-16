# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1 — Builder
# Compila el binario Go con todas las optimizaciones de tamaño activadas.
# El binario resultante es estático (CGO_ENABLED=0) y no necesita libc.
# ─────────────────────────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

# git es necesario para go mod download con dependencias de VCS
RUN apk add --no-cache git

WORKDIR /build

# Copiar los archivos de dependencias primero para aprovechar el cache de Docker.
# Si go.mod y go.sum no cambian, este layer se reutiliza en rebuilds subsecuentes.
COPY go.mod go.sum ./
RUN go mod download

# Copiar el código fuente completo
COPY . .

# Compilar con flags de optimización de tamaño:
#   -w  → elimina la tabla de símbolos de debug
#   -s  → elimina la tabla de símbolos
#   CGO_ENABLED=0 → binario estático, sin dependencias de libc
#   GOOS=linux    → target explícito (necesario si se compila desde macOS/Windows)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o casadelrey-backend .

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2 — Runtime
# Imagen final mínima (~5MB base). Solo contiene el binario compilado.
# scratch sería más pequeño, pero scratch-alpine permite usar ca-certificates
# para conexiones TLS (necesario para Supabase, SendGrid, Stripe).
# ─────────────────────────────────────────────────────────────────────────────
FROM alpine:3.20

# ca-certificates: necesario para conexiones HTTPS salientes (Stripe, SendGrid, etc.)
# tzdata: soporte para zonas horarias (logs con hora local)
RUN apk add --no-cache ca-certificates tzdata

# Usuario no-root por seguridad: el servidor no corre como root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copiar solo el binario compilado desde el stage anterior
COPY --from=builder /build/casadelrey-backend .

# Crear el directorio de uploads con permisos correctos
# (En Dokploy, montar un volume en /app/uploads para persistencia)
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Cambiar al usuario no-root antes de ejecutar
USER appuser

# Exponer el puerto del servidor (configurable via PORT env var)
EXPOSE 8080

# Healthcheck: Dokploy y Docker lo usan para saber si el contenedor está listo.
# Verifica el endpoint /health cada 30 segundos.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

# Comando de arranque del servidor
CMD ["./casadelrey-backend"]
