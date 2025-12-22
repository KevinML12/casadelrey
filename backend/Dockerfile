# STAGE 1: Build
FROM github.com/golang:1.21-alpine AS builder

# Instalar dependencias necesarias
RUN apk add --no-cache git

WORKDIR /app

# Copiar archivos de dependencias
COPY go.mod go.sum ./
RUN go mod download

# Copiar el código fuente
COPY . .

# Compilar el binario optimizado
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main .

# STAGE 2: Run (Imagen Final Ligera)
FROM alpine:3.18

RUN apk add --no-cache ca-certificates

WORKDIR /root/

# Copiar el binario desde el builder
COPY --from=builder /app/main .
# Copiar el archivo .env si es necesario (en Fly.io se usan secrets)
COPY --from=builder /app/.env . 

EXPOSE 8080

CMD ["./main"]