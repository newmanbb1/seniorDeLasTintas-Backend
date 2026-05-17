#!/bin/bash
set -e

echo "Esperando que Evolution API esté listo..."
sleep 10

# Usar el API key del ambiente
API_KEY="${EVOLUTION_API_KEY}"
INSTANCE_NAME="${INSTANCE_NAME:-Señor_de_las_Tintas}"

echo "Creando instancia: $INSTANCE_NAME"

# Intentar crear la instancia
response=$(curl -s -X POST "http://localhost:8080/instance/create" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"instanceName\": \"$INSTANCE_NAME\", \"qrcode\": true}" || echo "failed")

if echo "$response" | grep -q "error"; then
  echo "La instancia ya existe o hubo un error: $response"
else
  echo "Instancia creada exitosamente"
  echo "$response"
fi

echo "Esperando 5 segundos para que la instancia esté lista..."
sleep 5

echo "Configurando webhook para la instancia..."
curl -s -X PUT "http://localhost:8080/instance/Señor_de_las_Tintas" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "http://backend:3000/chatbot/webhook",
    "webhookByEvents": false,
    "qrcode": {
      "enabled": true
    }
  }' || echo "Webhook config might have failed"

echo "Inicialización completada"