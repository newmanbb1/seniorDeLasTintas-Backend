#!/usr/bin/env bash
# ==============================================================================
# Script de asignación automática de imágenes a productos del catálogo maestro
# Busca productos que NO tienen imagen en la BD y les asigna su foto desde la web.
#
# Uso en VPS:
#   bash deploy/fetch-supply-images.sh [opciones]
#
# Ejemplos:
#   bash deploy/fetch-supply-images.sh --dry-run             # Probar sin guardar cambios
#   bash deploy/fetch-supply-images.sh --limit=10            # Procesar solo 10 productos
#   bash deploy/fetch-supply-images.sh --code=ST-0005        # Procesar solo un producto
#   bash deploy/fetch-supply-images.sh                       # Procesar todos los pendientes
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$BACKEND_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
[[ -f "$COMPOSE_FILE" ]] || COMPOSE_FILE="docker-compose.yml"

echo "==> Iniciando script de imágenes en contenedor backend ($COMPOSE_FILE)..."

# Ejecutar dentro del contenedor backend (donde están conectadas la BD y el volumen de uploads)
docker compose -f "$COMPOSE_FILE" exec -T backend node dist/scripts/fetch-supply-images.js "$@"
