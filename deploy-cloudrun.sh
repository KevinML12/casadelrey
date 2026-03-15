#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-cloudrun.sh — Setup inicial y deploy manual a Google Cloud Run
# ─────────────────────────────────────────────────────────────────────────────
# Ejecutar UNA VEZ para el setup inicial. Los deploys posteriores se hacen
# automáticamente via GitHub Actions con cada push a main.
#
# Requisitos:
#   - gcloud CLI instalado: https://cloud.google.com/sdk/docs/install
#   - Sesión activa: gcloud auth login
#   - Tener los valores de DATABASE_URL y JWT_SECRET listos
#
# Uso:
#   chmod +x deploy-cloudrun.sh
#   ./deploy-cloudrun.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail  # Detener si hay error, variable no definida, o fallo en pipe

# ── Colores para output ───────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN — Editar estos valores antes de ejecutar
# ─────────────────────────────────────────────────────────────────────────────

PROJECT_ID=""          # ← Tu GCP Project ID (ej: casadelrey-123456)
                       #   gcloud projects list  → para verlos

REGION="us-central1"   # ← Región (us-central1 = Iowa, más barato con créditos)
SERVICE="casadelrey-backend"
REGISTRY="${REGION}-docker.pkg.dev"
REPO="casadelrey"

# Variables de entorno del backend (se guardan en Secret Manager de GCP)
DATABASE_URL=""        # ← postgresql://postgres.[ref]:[pass]@...supabase.com:5432/postgres
JWT_SECRET=""          # ← openssl rand -hex 32
CLIENT_URL=""          # ← https://casadelreyhue.vercel.app (URL de Vercel)
SENDGRID_API_KEY=""    # ← (opcional) SG.xxxxx

# ─────────────────────────────────────────────────────────────────────────────

# Verificar que se llenaron los valores obligatorios
[[ -z "$PROJECT_ID" ]]   && fail "Falta PROJECT_ID. Edita el script antes de ejecutar."
[[ -z "$DATABASE_URL" ]] && fail "Falta DATABASE_URL."
[[ -z "$JWT_SECRET" ]]   && fail "Falta JWT_SECRET."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CasaDelRey — Deploy a Google Cloud Run"
echo "  Proyecto: $PROJECT_ID | Región: $REGION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── PASO 1: Seleccionar proyecto GCP ─────────────────────────────────────────
log "Configurando proyecto GCP: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# ── PASO 2: Habilitar las APIs necesarias ─────────────────────────────────────
log "Habilitando APIs de GCP (Cloud Run, Artifact Registry, Cloud Build, Secret Manager)..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  --quiet

# ── PASO 3: Crear repositorio en Artifact Registry ───────────────────────────
log "Creando repositorio Docker en Artifact Registry..."
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Imágenes Docker de CasaDelRey" \
  --quiet 2>/dev/null || warn "El repositorio '$REPO' ya existe, continuando..."

# ── PASO 4: Crear los secretos en Secret Manager ─────────────────────────────
# Almacenar vars sensibles en Secret Manager (más seguro que env vars planas)
log "Guardando secretos en Secret Manager..."

create_or_update_secret() {
  local name="$1"
  local value="$2"
  if gcloud secrets describe "$name" --quiet &>/dev/null; then
    warn "Secreto '$name' ya existe, actualizando versión..."
    echo -n "$value" | gcloud secrets versions add "$name" --data-file=-
  else
    echo -n "$value" | gcloud secrets create "$name" \
      --data-file=- \
      --replication-policy=automatic \
      --quiet
    log "Secreto '$name' creado."
  fi
}

create_or_update_secret "DATABASE_URL" "$DATABASE_URL"
create_or_update_secret "JWT_SECRET"   "$JWT_SECRET"

# ── PASO 5: Construir imagen Docker ──────────────────────────────────────────
IMAGE="${REGISTRY}/${PROJECT_ID}/${REPO}/backend:latest"

log "Construyendo imagen Docker con Cloud Build..."
log "  (Contexto: ./backend, Dockerfile: ./backend/Dockerfile)"
gcloud builds submit ./backend \
  --tag "$IMAGE" \
  --quiet

# ── PASO 6: Desplegar en Cloud Run ───────────────────────────────────────────
log "Desplegando en Cloud Run..."

# Construir el string de env vars opcionales
ENV_VARS="ENV=production,PORT=8080"
[[ -n "$CLIENT_URL" ]]      && ENV_VARS="${ENV_VARS},CLIENT_URL=${CLIENT_URL}"
[[ -n "$SENDGRID_API_KEY" ]] && ENV_VARS="${ENV_VARS},SENDGRID_API_KEY=${SENDGRID_API_KEY}"

gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --platform managed \
  --region "$REGION" \
  --port 8080 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 30s \
  --concurrency 80 \
  --set-env-vars "$ENV_VARS" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest" \
  --quiet

# ── PASO 7: Obtener y mostrar la URL del servicio ────────────────────────────
SERVICE_URL=$(gcloud run services describe "$SERVICE" \
  --platform managed \
  --region "$REGION" \
  --format "value(status.url)")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "¡Deploy completado!"
echo ""
echo "  Backend URL:    ${SERVICE_URL}"
echo "  Health check:   ${SERVICE_URL}/health"
echo "  API base:       ${SERVICE_URL}/api/v1"
echo ""
echo "  Próximos pasos:"
echo "  1. Verificar: curl ${SERVICE_URL}/health"
echo "  2. Actualizar VITE_API_URL en Vercel:"
echo "     ${SERVICE_URL}/api/v1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── PASO 8 (opcional): Crear Service Account para GitHub Actions ──────────────
echo ""
warn "¿Crear Service Account para GitHub Actions (CI/CD automático)? [y/N]"
read -r CREATE_SA

if [[ "$CREATE_SA" =~ ^[Yy]$ ]]; then
  SA_NAME="github-actions-deploy"
  SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

  log "Creando Service Account: $SA_NAME"
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="GitHub Actions Deploy" \
    --quiet 2>/dev/null || warn "Service Account ya existe."

  log "Asignando roles necesarios..."
  for ROLE in \
    "roles/run.admin" \
    "roles/artifactregistry.writer" \
    "roles/cloudbuild.builds.editor" \
    "roles/iam.serviceAccountUser" \
    "roles/secretmanager.secretAccessor"; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
      --member="serviceAccount:${SA_EMAIL}" \
      --role="$ROLE" \
      --quiet
  done

  log "Generando clave JSON..."
  gcloud iam service-accounts keys create sa-key.json \
    --iam-account="$SA_EMAIL" \
    --quiet

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Service Account creada. Configura estos secretos en GitHub:"
  echo ""
  echo "  GitHub → tu repo → Settings → Secrets → Actions"
  echo ""
  echo "  GCP_PROJECT_ID   = $PROJECT_ID"
  echo "  GCP_SA_KEY       = (contenido de sa-key.json en base64)"
  echo "  DATABASE_URL     = $DATABASE_URL"
  echo "  JWT_SECRET       = $JWT_SECRET"
  echo "  CLIENT_URL       = $CLIENT_URL"
  [[ -n "$SENDGRID_API_KEY" ]] && echo "  SENDGRID_API_KEY = $SENDGRID_API_KEY"
  echo ""
  echo "  Para codificar la clave en base64:"
  echo "  base64 -i sa-key.json | pbcopy   (macOS)"
  echo "  base64 -w 0 sa-key.json          (Linux)"
  echo ""
  warn "Elimina sa-key.json después de subirlo a GitHub Secrets:"
  echo "  rm sa-key.json"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
