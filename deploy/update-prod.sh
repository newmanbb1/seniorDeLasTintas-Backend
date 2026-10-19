#!/usr/bin/env bash
# Update en producción — copiar al VPS o ejecutar desde deploy-remote.sh
# Ruta real: /opt/senior-tintas (con "ior")
set -euo pipefail

DEPLOY_PATH="/opt/senior-tintas"
BACKEND_DIR="$DEPLOY_PATH/seniorDeLasTintas-Backend"
FRONTEND_DIR="$DEPLOY_PATH/frontend-senor-tintas"

log() { printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }

[[ -d "$BACKEND_DIR/.git" ]] || { echo "No existe $BACKEND_DIR"; exit 1; }

# Respaldo de seguridad y prevención de conflictos en Caddyfile
if [[ -f "$BACKEND_DIR/Caddyfile" ]]; then
  cp -a "$BACKEND_DIR/Caddyfile" "$BACKEND_DIR/Caddyfile.backup-$(date +%Y%m%d-%H%M%S)"
fi
if ! git -C "$BACKEND_DIR" diff --quiet Caddyfile 2>/dev/null; then
  log "Descartando modificaciones manuales en Caddyfile (respaldo guardado) para sincronizar versión con HTTPS del repositorio..."
  git -C "$BACKEND_DIR" checkout -- Caddyfile
fi

log "Pull backend..."
git -C "$BACKEND_DIR" pull --ff-only origin main

log "Pull frontend..."
git -C "$FRONTEND_DIR" pull --ff-only origin main

log "Build + restart (BD y volúmenes intactos)..."
cd "$BACKEND_DIR"

COMPOSE_CMD=(docker compose -f docker-compose.prod.yml)

"${COMPOSE_CMD[@]}" build backend frontend
"${COMPOSE_CMD[@]}" up -d --remove-orphans

log "Validando y recargando Caddy (HTTPS)..."
if "${COMPOSE_CMD[@]}" exec -T caddy caddy validate --config /etc/caddy/Caddyfile; then
  "${COMPOSE_CMD[@]}" exec -T caddy caddy reload --config /etc/caddy/Caddyfile || true
  log "Caddy validado y recargado con HTTPS."
else
  log "ADVERTENCIA: La validación de Caddy falló. Revisa: docker logs --tail 50 caddy_proxy"
fi

log "Estado:"
"${COMPOSE_CMD[@]}" ps

log "Listo. Catálogo y BD no se tocaron (sin seed, sin down -v)."
log "Prueba HTTPS externamente:"
log "  curl -I https://xn--seordelastintas-zqb.tech"
