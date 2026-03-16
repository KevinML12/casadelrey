#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-azure.sh — Deploy a Azure Container Apps (versión simplificada)
# Usa "az containerapp up" que maneja el registry automáticamente.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Config ────────────────────────────────────────────────────────────────────
RESOURCE_GROUP="casadelrey-rg"
LOCATION="westus2"    # eastus no permitido en Azure for Students
SERVICE="casadelrey-backend"

# ── Cargar backend/.env ───────────────────────────────────────────────────────
ENV_FILE="./backend/.env"
[[ ! -f "$ENV_FILE" ]] && fail "No se encontró $ENV_FILE"

log "Cargando variables desde $ENV_FILE..."
set -o allexport
source <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$' | sed 's/"//g')
set +o allexport

[[ -z "${DATABASE_URL:-}" ]] && fail "DATABASE_URL no encontrada en $ENV_FILE"
[[ -z "${JWT_SECRET:-}" ]]   && fail "JWT_SECRET no encontrada en $ENV_FILE"
CLIENT_URL="${CLIENT_URL:-https://casadelreyhue.vercel.app}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CasaDelRey — Deploy a Azure Container Apps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Verificar login ───────────────────────────────────────────────────────────
log "Verificando sesión de Azure..."
ACCOUNT=$(az account show --query "user.name" -o tsv 2>/dev/null) \
  || fail "No estás logueado. Ejecuta: az login"
log "Logueado como: $ACCOUNT"

# ── Registrar providers (solo necesario la primera vez) ───────────────────────
log "Verificando providers..."
az provider register --namespace Microsoft.App              --wait --only-show-errors 2>/dev/null || true
az provider register --namespace Microsoft.OperationalInsights --wait --only-show-errors 2>/dev/null || true

# ── Crear Resource Group ──────────────────────────────────────────────────────
# Eliminar el grupo anterior si existe (puede estar en región incorrecta)
EXISTING_LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv 2>/dev/null || echo "")
if [[ -n "$EXISTING_LOCATION" && "$EXISTING_LOCATION" != "$LOCATION" ]]; then
  warn "Resource Group existe en '$EXISTING_LOCATION', eliminando para recrear en '$LOCATION'..."
  az group delete --name "$RESOURCE_GROUP" --yes --no-wait --output none
  log "Esperando eliminación..."
  az group wait --name "$RESOURCE_GROUP" --deleted 2>/dev/null || true
fi

log "Creando Resource Group: $RESOURCE_GROUP en $LOCATION..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

# ── Deploy con "az containerapp up" ──────────────────────────────────────────
# Este comando hace TODO automáticamente:
#   - Crea un ACR con nombre único generado por Azure
#   - Construye la imagen Docker desde ./backend/Dockerfile
#   - Crea el entorno de Container Apps
#   - Despliega el contenedor
log "Construyendo imagen y desplegando en Container Apps..."
log "(Esto tarda ~5 minutos, es normal)"

az containerapp up \
  --name "$SERVICE" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --source ./backend \
  --target-port 8080 \
  --ingress external \
  --env-vars \
    "ENV=production" \
    "PORT=8080" \
    "CLIENT_URL=${CLIENT_URL}" \
    "DATABASE_URL=${DATABASE_URL}" \
    "JWT_SECRET=${JWT_SECRET}"

# ── Obtener URL final ─────────────────────────────────────────────────────────
SERVICE_URL=$(az containerapp show \
  --name "$SERVICE" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.configuration.ingress.fqdn" -o tsv)

SERVICE_URL="https://${SERVICE_URL}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "¡Deploy completado!"
echo ""
echo "  Backend URL:  ${SERVICE_URL}"
echo "  Health check: ${SERVICE_URL}/health"
echo "  API base:     ${SERVICE_URL}/api/v1"
echo ""
echo "  Siguiente paso — actualizar VITE_API_URL en Vercel:"
echo "  ${SERVICE_URL}/api/v1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
