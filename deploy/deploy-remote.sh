#!/usr/bin/env bash
# Ejecutar desde tu PC: ./deploy/deploy-remote.sh
# Requiere SSH (recomendado: llave pública en el VPS, no password en scripts)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${DEPLOY_ENV:-$SCRIPT_DIR/deploy.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
else
  echo "Copia deploy/deploy.env.example a deploy/deploy.env y configura VPS_HOST, etc." >&2
  exit 1
fi

: "${VPS_HOST:?VPS_HOST requerido en deploy.env}"
: "${VPS_USER:?VPS_USER requerido en deploy.env}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/senor-tintas}"
VPS_PORT="${VPS_PORT:-22}"

SSH_OPTS=(-o "StrictHostKeyChecking=accept-new" -p "$VPS_PORT")

echo "==> Subiendo script de actualización al VPS..."
ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" "mkdir -p '$DEPLOY_PATH/deploy'"
scp "${SSH_OPTS[@]}" "$SCRIPT_DIR/server-update.sh" "$VPS_USER@$VPS_HOST:$DEPLOY_PATH/deploy/server-update.sh"

echo "==> Ejecutando actualización remota..."
ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" \
  "chmod +x '$DEPLOY_PATH/deploy/server-update.sh' && \
   DEPLOY_PATH='$DEPLOY_PATH' \
   BACKEND_BRANCH='${BACKEND_BRANCH:-main}' \
   FRONTEND_BRANCH='${FRONTEND_BRANCH:-main}' \
   BACKEND_REPO='${BACKEND_REPO:-https://github.com/newmanbb1/seniorDeLasTintas-Backend.git}' \
   FRONTEND_REPO='${FRONTEND_REPO:-https://github.com/newmanbb1/frontend-senor-tintas.git}' \
   RUN_SEED='${RUN_SEED:-false}' \
   bash '$DEPLOY_PATH/deploy/server-update.sh'"

echo "==> Listo. Revisa logs si algo falló:"
echo "    ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_PATH/seniorDeLasTintas-Backend && docker compose logs -f --tail=50'"
