#!/usr/bin/env bash
# Ejecutar EN el VPS (o vía deploy-remote.sh)
# Actualiza código, reconstruye imágenes y reinicia servicios sin borrar volúmenes ni .env
set -euo pipefail

# DEPLOY_PATH = carpeta padre que contiene seniorDeLasTintas-Backend/ y frontend-senor-tintas/
# Si no existe /opt/senor-tintas, detectar automáticamente o definir en deploy.env
DEPLOY_PATH="${DEPLOY_PATH:-}"
if [[ -z "$DEPLOY_PATH" ]]; then
  for candidate in /opt/senior-tintas /opt/senor-tintas /root/senior-tintas /var/www/senior-tintas /home/senior-tintas /srv/senior-tintas; do
    [[ -d "$candidate/seniorDeLasTintas-Backend" ]] && DEPLOY_PATH="$candidate" && break
  done
  if [[ -z "$DEPLOY_PATH" ]]; then
    found="$(find /root /home /opt /var /srv -maxdepth 4 -type d -name seniorDeLasTintas-Backend 2>/dev/null | head -1)"
    [[ -n "$found" ]] && DEPLOY_PATH="$(dirname "$found")"
  fi
fi
[[ -n "$DEPLOY_PATH" ]] || die "No se encontró el proyecto. Define DEPLOY_PATH o ejecuta deploy/find-on-vps.sh"

BACKEND_DIR="${DEPLOY_PATH}/seniorDeLasTintas-Backend"
FRONTEND_DIR="${DEPLOY_PATH}/frontend-senor-tintas"
BACKEND_BRANCH="${BACKEND_BRANCH:-main}"
FRONTEND_BRANCH="${FRONTEND_BRANCH:-main}"
BACKEND_REPO="${BACKEND_REPO:-https://github.com/newmanbb1/seniorDeLasTintas-Backend.git}"
FRONTEND_REPO="${FRONTEND_REPO:-https://github.com/newmanbb1/frontend-senor-tintas.git}"
RUN_SEED="${RUN_SEED:-false}"

log() { printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
die() { echo "ERROR: $*" >&2; exit 1; }

command -v docker >/dev/null || die "Docker no instalado"
docker compose version >/dev/null 2>&1 || die "Docker Compose plugin no instalado"

mkdir -p "$DEPLOY_PATH"

clone_or_pull() {
  local dir="$1" repo="$2" branch="$3"
  if [[ -d "$dir/.git" ]]; then
    log "Actualizando $dir ($branch)..."
    git -C "$dir" fetch origin "$branch"
    git -C "$dir" checkout "$branch"
    git -C "$dir" pull --ff-only origin "$branch"
  else
    log "Clonando $repo en $dir..."
    git clone --branch "$branch" --depth 1 "$repo" "$dir"
  fi
}

clone_or_pull "$BACKEND_DIR" "$BACKEND_REPO" "$BACKEND_BRANCH"
clone_or_pull "$FRONTEND_DIR" "$FRONTEND_REPO" "$FRONTEND_BRANCH"

[[ -f "$BACKEND_DIR/.env" ]] || die "Falta $BACKEND_DIR/.env — créalo desde .env.example antes del primer deploy"

log "Construyendo imágenes..."
cd "$BACKEND_DIR"
COMPOSE_FILE="docker-compose.prod.yml"
[[ -f "$COMPOSE_FILE" ]] || COMPOSE_FILE="docker-compose.yml"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

"${COMPOSE[@]}" build --pull backend frontend

log "Reiniciando servicios (volúmenes y .env se conservan)..."
"${COMPOSE[@]}" up -d --remove-orphans

log "Esperando backend..."
for i in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T backend wget -q -O- http://localhost:3000/api/seed/status >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if [[ "$RUN_SEED" == "true" ]]; then
  log "Ejecutando seed..."
  "${COMPOSE[@]}" exec -T backend wget -q -O- --post-data='' http://localhost:3000/api/seed/init || true
fi

log "Estado de contenedores:"
"${COMPOSE[@]}" ps

log "Limpiando imágenes huérfanas..."
docker image prune -f >/dev/null || true

log "Deploy completado."
