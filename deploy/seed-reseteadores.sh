#!/usr/bin/env bash
# ==============================================================================
# Script de ejecución en producción / VPS para Reseteadores Digitales (69 productos)
# Categoría: Reseteadores digitales
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$BACKEND_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
[[ -f "$COMPOSE_FILE" ]] || COMPOSE_FILE="docker-compose.yml"

echo "=================================================================="
echo "🚀 SEED DE RESETEADORES DIGITALES (PRODUCCIÓN / LOCAL)"
echo "   Archivo Compose: $COMPOSE_FILE"
echo "=================================================================="

SQL_FILE="$BACKEND_DIR/src/scripts/seed-reseteadores-digitales.sql"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "❌ Error: No se encontró el archivo $SQL_FILE"
  exit 1
fi

# Detectar servicio de base de datos en docker-compose
DB_SERVICE="backend-db"
if docker compose -f "$COMPOSE_FILE" ps --services 2>/dev/null | grep -q "backend-db"; then
  DB_SERVICE="backend-db"
elif docker compose -f "$COMPOSE_FILE" ps --services 2>/dev/null | grep -q "postgres"; then
  DB_SERVICE="postgres"
fi

echo "📦 Aplicando migración SQL en servicio: $DB_SERVICE..."

# Ejecutar el archivo SQL directamente dentro del contenedor de base de datos
docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" psql -U postgres -d TintasDB < "$SQL_FILE"

echo ""
echo "🔍 Verificando datos insertados..."
docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" psql -U postgres -d TintasDB -c "
SELECT count(*) AS total_reseteadores FROM supply WHERE category = 'Reseteadores digitales' AND deleted_at IS NULL;
SELECT name, icon, color, is_active FROM category WHERE name = 'Reseteadores digitales';
SELECT count(*) AS total_inventarios FROM inventory i JOIN supply s ON i.supply_id = s.id WHERE s.category = 'Reseteadores digitales';
"

echo "🎉 ¡Migración de Reseteadores Digitales completada exitosamente!"

