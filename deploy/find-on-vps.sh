#!/usr/bin/env bash
# Pegar en el VPS: bash find-on-vps.sh
# O: curl ... | bash  /  scp desde tu PC
set -euo pipefail

echo "=== Contenedores Docker ==="
docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || echo "Docker no disponible"

echo ""
echo "=== docker-compose.yml ==="
find /root /home /opt /var /srv -name 'docker-compose.yml' 2>/dev/null

echo ""
echo "=== Carpetas con 'tintas' o 'senor' ==="
find /root /home /opt /var /srv -maxdepth 6 -type d \( -iname '*tintas*' -o -iname '*senor*' \) 2>/dev/null

echo ""
echo "=== Repos git ==="
find /root /home /opt /var /srv -maxdepth 5 -name '.git' -type d 2>/dev/null

echo ""
echo "=== Volúmenes Docker (BD / uploads) ==="
docker volume ls 2>/dev/null || true

echo ""
echo "=== Puertos en escucha ==="
ss -tlnp 2>/dev/null | grep -E ':80|:443|:3000|:3001|:8080' || netstat -tlnp 2>/dev/null | head -15
