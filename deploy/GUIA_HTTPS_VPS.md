# Guía de prevención y recuperación de HTTPS en el VPS

**Proyecto:** Senior de las Tintas  
**Dominio:** `señordelastintas.tech`  
**Dominio técnico (Punycode):** `xn--seordelastintas-zqb.tech`  
**IP del VPS:** `187.127.249.238`  
**Proxy inverso:** Caddy en Docker  
**Archivo principal:** `/opt/senior-tintas/seniorDeLasTintas-Backend/Caddyfile`

> Objetivo: conservar HTTPS, evitar que un despliegue sobrescriba la configuración correcta y contar con pasos seguros para diagnosticar y recuperar el servicio.

---

## 1. Qué ocurrió

Durante el diagnóstico se observó que:

- El dominio resolvía a la IP del VPS.
- El sitio respondía por HTTP.
- HTTPS fallaba en las pruebas realizadas.
- El backend NestJS respondía correctamente a una petición interna.
- Docker publicaba los puertos 80 y 443 para Caddy.
- La configuración activa de Caddy contenía un sitio `:80`, pero no declaraba el dominio como sitio HTTPS.
- `caddy validate` advirtió que el servidor escuchaba solo en el puerto HTTP y que no se aplicaría HTTPS automático.

La causa identificada fue una configuración incompleta de Caddy para el dominio en el repositorio (`:80`). Publicar el puerto 443 en Docker, por sí solo, no configura TLS.

## 2. Arquitectura

El tráfico fluye de la siguiente manera:

1. El navegador solicita `https://señordelastintas.tech` o `https://www.señordelastintas.tech`.
2. Caddy recibe la petición por HTTPS (puerto 443 TCP/UDP).
3. Caddy redirige automáticamente cualquier petición HTTP (puerto 80) a HTTPS (puerto 443).
4. Caddy dirige `/api/*` al backend NestJS en `backend:3000`.
5. Caddy dirige el resto de las rutas al frontend SPA en `frontend:80`.
6. Los servicios internos, como PostgreSQL y Redis, permanecen en la red privada de Docker y no se exponen públicamente.

## 3. Configuración oficial de Caddy (`Caddyfile`)

```caddyfile
# Caddyfile para Producción - Señor de las Tintas
# Dominio oficial en Punycode (señordelastintas.tech)
# Caddy gestiona y renueva automáticamente certificados TLS (Let's Encrypt / ZeroSSL)
# y redirige automáticamente HTTP (puerto 80) a HTTPS (puerto 443).

xn--seordelastintas-zqb.tech, www.xn--seordelastintas-zqb.tech {
	encode gzip zstd

	# Backend NestJS — preserva el prefijo /api
	handle /api/* {
		reverse_proxy backend:3000
	}

	# Frontend SPA (Nginx) — catch-all
	handle {
		reverse_proxy frontend:80
	}
}

# Evolution API NO se expone públicamente.
# El backend se conecta internamente a evolution:8080 en la red Docker.
```

## 4. Reglas operativas para evitar que vuelva a pasar

- **El archivo `Caddyfile` del repositorio ya incluye el dominio con HTTPS**: Nunca volver a cambiarlo por un bloque `:80`.
- Los scripts `deploy/server-update.sh` y `deploy/update-prod.sh` crean automáticamente un respaldo con timestamp de `Caddyfile` antes de actualizar y descartan conflictos locales temporales para asegurar que la versión con HTTPS se aplique.
- Tras levantar los contenedores, los scripts validan automáticamente la sintaxis con `caddy validate` y recargan la configuración con `caddy reload`.
- **Nunca ejecutar `docker compose down -v`** en el VPS: el flag `-v` borraría los volúmenes `caddy_data` (certificados TLS) y de bases de datos.
- Probar HTTPS externamente (desde una máquina fuera del VPS) con `curl -I https://xn--seordelastintas-zqb.tech`.

## 5. Procedimiento seguro para modificar Caddy en el VPS

```bash
cd /opt/senior-tintas/seniorDeLasTintas-Backend

# 1. Respaldar
cp -a Caddyfile "Caddyfile.backup-$(date +%Y%m%d-%H%M%S)"

# 2. Validar sintaxis antes de recargar
docker exec caddy_proxy caddy validate --config /etc/caddy/Caddyfile

# 3. Recargar Caddy sin downtime
docker exec caddy_proxy caddy reload --config /etc/caddy/Caddyfile

# 4. Revisar logs
docker logs --since 10m caddy_proxy 2>&1 | tail -50
```

## 6. Comprobación rápida del estado de HTTPS

```bash
# Probar cabeceras HTTPS desde fuera del servidor:
curl -sS -o /dev/null -w 'HTTPS Frontend: %{http_code}\n' https://xn--seordelastintas-zqb.tech/

# Probar API pública:
curl -sS -o /dev/null -w 'HTTPS API: %{http_code}\n' https://xn--seordelastintas-zqb.tech/api/category/public
```
