#!/usr/bin/env bash
# Primera instalación EN el VPS (Docker + estructura de carpetas + .env plantilla)
# Uso: bash setup-vps.sh
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/senior-tintas}"
BACKEND_DIR="${DEPLOY_PATH}/seniorDeLasTintas-Backend"
BACKEND_REPO="${BACKEND_REPO:-https://github.com/newmanbb1/seniorDeLasTintas-Backend.git}"
FRONTEND_REPO="${FRONTEND_REPO:-https://github.com/newmanbb1/frontend-senor-tintas.git}"

log() { printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Ejecuta como root o con sudo." >&2
  exit 1
fi

log "Instalando dependencias (Docker, Git)..."
if command -v apt-get >/dev/null; then
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl git ufw
  if ! command -v docker >/dev/null; then
    curl -fsSL https://get.docker.com | sh
  fi
elif command -v dnf >/dev/null; then
  dnf install -y docker git
  systemctl enable --now docker
else
  echo "SO no soportado automáticamente. Instala Docker y Git manualmente." >&2
  exit 1
fi

log "Firewall básico (SSH + HTTP + HTTPS)..."
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

mkdir -p "$DEPLOY_PATH"

if [[ ! -d "$BACKEND_DIR/.git" ]]; then
  log "Clonando repositorios..."
  git clone --branch main --depth 1 "$BACKEND_REPO" "$BACKEND_DIR"
  git clone --branch main --depth 1 "$FRONTEND_REPO" "${DEPLOY_PATH}/frontend-senor-tintas"
fi

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  log "Creado $BACKEND_DIR/.env desde .env.example"
  log "IMPORTANTE: edita .env con secretos de producción antes de levantar:"
  log "  nano $BACKEND_DIR/.env"
  log "  - DB_PASSWORD, JWT_*, CORS_ORIGIN, DEEPSEEK_API_KEY, WHATSAPP_NUMBER"
  log "  - DB_HOST=backend-db, DB_SYNC=false, NODE_ENV=production"
fi

log "Setup base listo. Siguiente paso:"
log "  1) Editar .env de producción"
log "  2) cd $BACKEND_DIR && docker compose up -d --build"
log "  3) Desde tu PC: ./deploy/deploy-remote.sh para futuros updates"
