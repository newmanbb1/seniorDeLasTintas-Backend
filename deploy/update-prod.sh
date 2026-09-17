#!/usr/bin/env bash
# Update en producción — copiar al VPS o ejecutar desde deploy-remote.sh
# Ruta real: /opt/senior-tintas (con "ior")
set -euo pipefail

DEPLOY_PATH="/opt/senior-tintas"
BACKEND_DIR="$DEPLOY_PATH/seniorDeLasTintas-Backend"
FRONTEND_DIR="$DEPLOY_PATH/frontend-senor-tintas"

log() { printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }

[[ -d "$BACKEND_DIR/.git" ]] || { echo "No existe $BACKEND_DIR"; exit 1; }

log "Pull backend..."
git -C "$BACKEND_DIR" pull --ff-only origin main

log "Pull frontend..."
git -C "$FRONTEND_DIR" pull --ff-only origin main

log "Build + restart (BD y volúmenes intactos)..."
cd "$BACKEND_DIR"

COMPOSE_CMD=(docker compose -f docker-compose.prod.yml)

"${COMPOSE_CMD[@]}" build backend frontend
"${COMPOSE_CMD[@]}" up -d --remove-orphans

log "Estado:"
"${COMPOSE_CMD[@]}" ps

log "Listo. Catálogo y BD no se tocaron (sin seed, sin down -v)."
