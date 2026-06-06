# Documentación completa del Sistema de Chatbot WhatsApp

## Índice
1. [Arquitectura General](#1-arquitectura-general)
2. [Infraestructura Docker](#2-infraestructura-docker)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Backend - Módulo Chatbot](#4-backend---módulo-chatbot)
5. [Frontend - Página de Conexión](#5-frontend---página-de-conexión)
6. [Flujo de Conexión WhatsApp](#6-flujo-de-conexión-whatsapp)
7. [Flujo de Atención al Cliente](#7-flujo-de-atención-al-cliente)
8. [Base de Datos - Entidades](#8-base-de-datos---entidades)
9. [Estado Actual](#9-estado-actual)

---

## 1. Arquitectura General

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Teléfono   │────▶│  Evolution API   │────▶│   Backend        │
│   WhatsApp   │◀────│  (v2.3.6)        │◀────│   NestJS :3000   │
└──────────────┘     │  :8080           │     └────────┬────────┘
                     │  Baileys Lib     │              │
                     └────────┬─────────┘              │
                              │                        │
                     ┌────────▼─────────┐     ┌────────▼────────┐
                     │  PostgreSQL       │     │  PostgreSQL      │
                     │  evolution DB     │     │  TintasDB        │
                     │  (instancias,     │     │  (negocio:       │
                     │   webhooks)       │     │   inventario,    │
                     └──────────────────┘     │   empleados,     │
                                              │   attendance)    │
                     ┌──────────────────┐     └─────────────────┘
                     │  Redis :6379     │
                     │  (caché)         │        ┌─────────────────┐
                     └──────────────────┘        │  Frontend       │
                                                 │  React + Vite  │
                          ┌──────────────┐       │  Nginx :3001    │
                          │  SSE Stream  │◀──────│  /api/chatbot/  │
                          │  tiempo real │       │  events         │
                          └──────────────┘       └─────────────────┘
```

### Componentes principales

| Componente | Tecnología | Puerto | Propósito |
|------------|-----------|--------|-----------|
| **Evolution API** | Node.js + Baileys | 8080 | Middleware WhatsApp Web, genera QR, envía/recibe mensajes |
| **Backend NestJS** | NestJS + TypeORM | 3000 | Lógica de negocio, chatbot, webhooks, SSE |
| **Frontend** | React + Vite + Nginx | 3001 | Panel admin, página de conexión WhatsApp |
| **PostgreSQL (evolution)** | PostgreSQL 15 | - | DB de Evolution API (instancias, webhooks) |
| **PostgreSQL (backend)** | PostgreSQL 15 | - | DB del negocio (inventario, empleados, attendance) |
| **Redis** | Redis 7 | 6379 | Caché para Evolution API |

---

## 2. Infraestructura Docker

Archivo: `docker-compose.yml` (149 líneas)

### Servicios

#### `postgres` (evolution_postgres)
- **Imagen:** postgres:15
- **Propósito:** Base de datos para Evolution API
- **DB:** evolution
- **Healthcheck:** pg_isready cada 5s

#### `redis` (app_redis)
- **Imagen:** redis:7
- **Propósito:** Caché para Evolution API (sesiones, baileys, instancias)
- **Volumen:** redis_data:/data

#### `evolution` (evolution_api)
- **Imagen:** evoapicloud/evolution-api:v2.3.6
- **Puerto:** 8080:8080
- **Depende de:** postgres (healthy) + redis
- **Comando:** `node dist/main.js`
- **Volumen:** ./uploads:/app/uploads

#### `backend-db` (backend_postgres)
- **Imagen:** postgres:15
- **Propósito:** Base de datos del negocio
- **DB:** TintasDB

#### `backend` (backend_nestjs)
- **Build:** desde Dockerfile del proyecto
- **Puerto:** 3000:3000
- **Depende de:** backend-db (healthy) + evolution

#### `frontend` (frontend_nginx)
- **Build:** desde frontend-senor-tintas/
- **Puerto:** 3001:80
- **VITE_API_URL:** /api (proxy inverso hacia backend)

### Red
- **Nombre:** app_network
- **Driver:** bridge
- Todos los contenedores comparten esta red

---

## 3. Variables de Entorno

### Archivo `.env`

```env
# ===============================
# Evolution API
# ===============================
EVOLUTION_API_KEY=fixed-api-key-12345
INSTANCE_API_KEY=2FF39E0A-9FC4-41A3-A6E5-03ED7DD33360
INSTANCE_NAME=senorbot

# ===============================
# Backend NestJS
# ===============================
PORT=3000
DB_HOST=backend-db
DB_PORT=5432
DB_NAME=TintasDB
DB_USERNAME=postgres
DB_PASSWORD=Tintas@2024Secure
DB_SYNC=false

# ===============================
# Chatbot (Evolution API URL)
# ===============================
EVOLUTION_URL=http://evolution:8080
WEBHOOK_SECRET=webhook-shared-secret-2024

# ===============================
# Auditoría (Usuario del sistema)
# ===============================
SYSTEM_AUDIT_USER_ID=00000000-0000-4000-8000-000000000001

# ===============================
# JWT Auth
# ===============================
JWT_SECRET=super-secret-key-jwt-senior-de-las-tintas-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_DAYS=7
```

### Variables de entorno del contenedor `evolution`

| Variable | Valor | Propósito |
|----------|-------|-----------|
| `SERVER_TYPE` | `http` | Tipo de servidor |
| `SERVER_PORT` | `8080` | Puerto del servidor |
| `AUTHENTICATION_API_KEY` | `${EVOLUTION_API_KEY}` | API key global para autenticación |
| `DATABASE_ENABLED` | `true` | Habilitar persistencia en DB |
| `DATABASE_PROVIDER` | `postgresql` | Motor de base de datos |
| `DATABASE_CONNECTION_URI` | `postgresql://postgres:${DB_PASSWORD}@postgres:5432/evolution` | URI de conexión |
| `DATABASE_CONNECTION_CLIENT_NAME` | `evolution_client` | Nombre del cliente en DB |
| `CONFIG_SESSION_PHONE_CLIENT` | `Chrome` | Nombre mostrado en la conexión del teléfono |
| `CONFIG_SESSION_PHONE_NAME` | `Chrome` | Nombre del navegador para fingerprint |
| `CACHE_REDIS_ENABLED` | `true` | Habilitar caché Redis |
| `CACHE_REDIS_URI` | `redis://redis:6379/6` | URI de Redis |
| `REDIS_ENABLED` | `true` | Habilitar Redis |
| `REDIS_URI` | `redis://redis:6379` | URI de Redis principal |
| `QR_CODE_ON_CHAT` | `true` | Mostrar QR en logs |
| `DELETE_TOKEN_ON_DIE` | `false` | No eliminar token al desconectar |
| `WEBHOOK_GLOBAL_ENABLED` | `false` | Webhook global deshabilitado (usamos webhook por instancia) |

### Variables de entorno del contenedor `backend`

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DB_HOST` | `backend-db` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `TintasDB` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | `${DB_PASSWORD}` |
| `DB_SYNC` | `false` |
| `EVOLUTION_URL` | `http://evolution:8080` |
| `EVOLUTION_API_KEY` | `${EVOLUTION_API_KEY}` |
| `INSTANCE_API_KEY` | `${INSTANCE_API_KEY}` |
| `INSTANCE_NAME` | `${INSTANCE_NAME}` |
| `SYSTEM_AUDIT_USER_ID` | `00000000-0000-4000-8000-000000000001` |

---

## 4. Backend - Módulo Chatbot

### Estructura de archivos

```
src/modules/chatbot/
├── chatbot.module.ts
├── controllers/
│   └── chatbot.controller.ts
├── dto/
│   ├── filter-chatbot-log.dto.ts
│   ├── send-message.dto.ts
│   └── webhook.dto.ts
├── entities/
│   ├── chatbot-log.entity.ts
│   ├── whatsapp-message.entity.ts
│   └── whatsapp-session.entity.ts
└── services/
    ├── chatbot.service.ts
    ├── conversation.service.ts
    ├── evolution-api.service.ts
    └── whatsapp-session.service.ts
```

### 4.1 `chatbot.module.ts`

Registra el módulo con TypeORM importando 7 entidades:
- WhatsAppSession, WhatsAppMessage, ChatbotLog
- Branch, Inventory, Supply, Employee, Attendance

Exporta: ChatbotService, ConversationService

### 4.2 `chatbot.controller.ts`

**Endpoints:**

| Método | Ruta | Auth | Propósito |
|--------|------|------|-----------|
| `SSE` | `GET /chatbot/events` | Token (query) | Stream de eventos en tiempo real |
| `POST` | `/chatbot/webhook` | WebhookGuard | Webhook principal de Evolution API |
| `POST` | `/chatbot/webhook/messages-upsert` | WebhookGuard | Webhook específico messages.upsert |
| `POST` | `/chatbot/webhook/messages-update` | WebhookGuard | Webhook específico messages.update |
| `POST` | `/chatbot/webhook/chats-upsert` | WebhookGuard | Webhook específico chats.upsert |
| `POST` | `/chatbot/webhook/chats-update` | WebhookGuard | Webhook específico chats.update |
| `POST` | `/chatbot/webhook/contacts-update` | WebhookGuard | Webhook específico contacts.update |
| `POST` | `/chatbot/webhook/connection-update` | WebhookGuard | Webhook específico connection.update |
| `POST` | `/chatbot/webhook/qrcode-updated` | WebhookGuard | Webhook específico qrcode.updated |
| `POST` | `/chatbot/webhook/presence-update` | WebhookGuard | Webhook específico presence.update |
| `GET` | `/chatbot/logs` | JWT + Admin | Listar logs del chatbot |
| `POST` | `/chatbot/test` | JWT + Admin | Enviar mensaje de prueba |
| `GET` | `/chatbot/status` | Público | Estado de conexión WhatsApp |
| `GET` | `/chatbot/conversations` | JWT + Admin | Listar conversaciones |
| `GET` | `/chatbot/conversations/:phone/messages` | JWT + Admin | Mensajes de una conversación |
| `POST` | `/chatbot/conversations/:phone/read` | JWT + Admin | Marcar como leída |
| `POST` | `/chatbot/conversations/:phone/messages` | JWT + Admin | Enviar mensaje manual |
| `POST` | `/chatbot/conversations/:phone/archive` | JWT + Admin | Archivar/desarchivar |
| `POST` | `/chatbot/reconnect` | Público | Reconectar instancia (regenera QR) |

**Webhook principal (`/chatbot/webhook`)**: Este es el endpoint que Evolution API configura como webhook de la instancia. Procesa estos eventos:
- `messages.upsert` / `message` / `messages.update` → Procesa mensaje entrante
- `chats.upsert` / `chats.set` → Sincroniza sesiones de chat
- `contacts.set` / `contacts.upsert` → Actualiza nombres de contactos
- `connection.update` → Emite estado de conexión vía SSE
- `qrcode.updated` → Emite QR vía SSE

### 4.3 `evolution-api.service.ts`

Servicio principal de comunicación con Evolution API.

**Configuración:**
- URL base: `http://evolution:8080` (desde EVOLUTION_URL)
- API Key: fija desde variable de entorno
- Nombre de instancia: `senorbot`
- Timeout: 15 segundos
- Máximo 10 reintentos con 3s de delay para esperar a Evolution

**Métodos:**

| Método | Descripción |
|--------|-------------|
| `onModuleInit()` | Al iniciar, espera a Evolution API y crea/verifica la instancia |
| `waitForEvolution()` | Espera hasta 30s a que Evolution API esté disponible |
| `initializeInstance()` | Verifica estado de la instancia; si no existe (404), la crea |
| `createInstance()` | POST /instance/create con integration=WHATSAPP-BAILEYS |
| `configureWebhook()` | Configura webhook apuntando a http://backend:3000/api/chatbot/webhook |
| `sendMessage(to, text)` | Envía mensaje de texto vía POST /message/sendText |
| `sendListMessage(to, title, desc, sections)` | Envía mensaje tipo lista |
| `sendButtonsMessage(to, title, buttons)` | Envía mensaje tipo botones |
| `sendManualMessage(to, text)` | Envía mensaje manual (usado desde el panel) |
| `getQrCode()` | Obtiene QR desde GET /instance/qrcode |
| `reconnectInstance()` | Elimina instancia, la recrea, llama a /instance/connect y obtiene QR |
| `getInstanceStatus()` | GET /instance/connectionState para saber si está open/close/connecting |

**Formato de número telefónico:**
- Números no-dígitos (con caracteres especiales): se mantienen igual
- Empieza con `591`: se agrega `@s.whatsapp.net`
- Empieza con `0`: reemplaza `0` por `591`
- 9 dígitos: antepone `591`
- Otro: agrega `@s.whatsapp.net` directamente

### 4.4 `chatbot.service.ts`

**Lógica del chatbot conversacional.**

Estados del flujo (`WhatsAppFlowState`):
```
MenuPrincipal → opción 1 → ConsultarStock (se mantiene hasta "0")
MenuPrincipal → opción 2 → Horarios (vuelve al menú)
MenuPrincipal → "asistencia" → ConsultarAsistencia (se mantiene hasta "0")
```

**Menú principal:**
```
le habla *Señor de las Tintas*

Como te podemos ayudar?

1 - Consultar todo el stock
2 - Horarios y servicios
0 - Menu principal

Responde con el numero de tu opcion
```

**Detección de intención** (cuando el usuario no usa números):
- `stock|tinta|canon|epson|hp|producto|consultar` → ConsultarStock
- `horario|ubicacion|address|sucursal|atencion|services` → ConsultarHorario
- `asistencia|empleado|entrada|salida|trabaj` → ConsultarAsistencia
- Solo números → MenuPrincipal
- Otro → Unknown (muestra menú)

**Funcionalidades:**

1. **Stock completo** (opción 1): Consulta inventario con `current_quantity > 0`, agrupa por producto y muestra por sucursal.

2. **Horarios y servicios** (opción 2): Muestra sucursales activas con nombre, horario, dirección y link de ubicación. Servicios: recarga de cartuchos, venta de tintas, mantenimiento de impresoras, impresiones.

3. **Consultar Stock por búsqueda** (escribir marca/nombre): Busca supplies por nombre o categoría, muestra hasta 3 coincidencias con stock por sucursal. Permite seguir consultando.

4. **Consultar Asistencia** (escribir nombre empleado): Busca empleado, muestra entrada/salida del día, horas trabajadas, y resumen del mes (puntuales, tardes, días trabajados).

### 4.5 `conversation.service.ts`

**Sistema de eventos en tiempo real y persistencia de conversaciones.**

Usa `Subject` de RxJS para emitir eventos vía SSE.
Los eventos disponibles son:
- `qrcode_updated` → Nuevo código QR (base64)
- `connection_status` → Estado de conexión (open/close/connecting)
- `conversations_updated` → Lista de conversaciones actualizada
- `new_message` → Nuevo mensaje recibido/enviado

**Métodos:**
- `subscribe()` → Retorna Observable<MessageEvent> para SSE
- `emit(event, data)` → Emite evento al Subject
- `getConversations()` → Lista sesiones ordenadas por último mensaje
- `getMessages(phone)` → Mensajes de una conversación (últimos 100)
- `markAsRead(phone)` → Resetea contador de no leídos
- `saveIncomingMessage(...)` → Guarda mensaje recibido, actualiza sesión, incrementa unread_count
- `saveOutgoingMessage(...)` → Guarda mensaje enviado
- `sendManualMessage(phone, text)` → Envía mensaje manual vía Evolution API y lo guarda
- `handleChatUpsert(chats)` → Sincroniza sesiones desde eventos de chats de Evolution
- `handleContactUpsert(contacts)` → Actualiza nombres de contactos desde Evolution
- `toggleArchive(phone)` → Archiva/desarchiva conversación

### 4.6 `whatsapp-session.service.ts`

**Gestión de sesiones de usuario.**

- `getOrCreateSession(phone, profileName?)`: Busca o crea sesión con estado `MenuPrincipal` por defecto
- `updateFlowState(phone, newState)`: Actualiza el estado del flujo conversacional
- `resetToMenu(phone)`: Vuelve al menú principal
- `getSession(phone)`: Obtiene sesión por número
- `getActiveSessions()`: Sesiones con interacción en los últimos 30 minutos

**WebhookAuthGuard** (`src/common/guards/webhook-auth.guard.ts`):
- Valida el header `x-webhook-secret` contra `WEBHOOK_SECRET`
- Rechaza con 401 si no coincide
- Si `WEBHOOK_SECRET` no está configurado en backend, rechaza todas las peticiones

---

## 5. Frontend - Página de Conexión

### Archivos

```
frontend-senor-tintas/src/
├── pages/WhatsApp/
│   └── Connection.tsx
└── services/
    ├── api.ts
    ├── whatsapp.ts
    └── chatbot.ts
```

### `pages/WhatsApp/Connection.tsx`

Componente React para gestionar la conexión WhatsApp.

**Estados:**
- `loading` → Verificando conexión inicial
- `open` → Conectado exitosamente (check verde)
- `close` → Desconectado (QR disponible)
- `connecting` → Escaneando QR

**Flujo al montar:**
1. `whatsappService.getStatus()` → Obtiene estado inicial
2. Si está `close` o no es `open`/`connecting`, llama a `handleReconnect()`
3. Abre SSE a `/api/chatbot/events?token=<jwt>`
4. Escucha eventos `qrcode_updated` y `connection_status`
5. Si SSE se cierra por error, NO reconecta (bug conocido)

**UI:**
- Estado `loading`: spinner + "Verificando conexión con Evolution API..."
- Estado `open`: checkmark + "¡Vinculado Exitosamente!" + botón para desconectar
- Estado `close`/`connecting`: QR code (img desde base64) + botón "Recargar Código QR"

### `services/whatsapp.ts`

```typescript
export const whatsappService = {
  getStatus: async () => {
    const response = await api.get('/chatbot/status');
    return response.data; // { state: 'open' | 'close' | 'connecting' }
  },
  reconnect: async () => {
    const response = await api.post('/chatbot/reconnect');
    return response.data?.data || response.data;
  },
  getEventsUrl: () => {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/chatbot/events`;
  }
};
```

### `services/api.ts`

Cliente Axios configurado con:
- Base URL: `VITE_API_URL` o `http://localhost:3000/api`
- Interceptor de request: inyecta `Authorization: Bearer <token>` y `branch_id`
- Interceptor de response: refresh token automático en 401

### `services/chatbot.ts`

Archivo placeholder (vacío, solo exporta objeto).

---

## 6. Flujo de Conexión WhatsApp

### Inicio del sistema
```
1. Backend inicia → evolution-api.service.onModuleInit()
2. Espera a Evolution API (hasta 30s, 10 intentos)
3. GET /instance/connectionState/senorbot
   ├── Si 404 → POST /instance/create (WHATSAPP-BAILEYS)
   ├── Si "open" → ya conectado, configurar webhook
   └── Si "close" → existe pero desconectada
4. POST /webhook/set/senorbot → configura webhook
   URL: http://backend:3000/api/chatbot/webhook
   Eventos: MESSAGES_UPSERT, MESSAGES_UPDATE, CHATS_UPSERT,
            CHATS_UPDATE, CHATS_SET, CONTACTS_SET,
            CONTACTS_UPSERT, CONNECTION_UPDATE, QRCODE_UPDATED
```

### Generación de QR
```
1. Evolution API conecta con WhatsApp via Baileys
2. Baileys genera QR → webhook qrcode.updated
3. Backend recibe webhook → chatbot.controller.handleWebhook()
4. conversationService.emit('qrcode_updated', { qrcode: base64 })
5. SSE envía a frontend
6. Connection.tsx recibe evento → setQrCode(data.payload.qrcode)
7. Usuario escanea QR con teléfono
```

### Reconexión manual
```
1. Usuario hace clic en "Recargar Código QR" o "Desconectar y Generar Nuevo QR"
2. POST /chatbot/reconnect
3. Backend llama a evolutionApiService.reconnectInstance()
4. DELETE /instance/delete/senorbot (elimina instancia)
5. POST /instance/create (recrea instancia)
6. GET /instance/connect/senorbot (obtiene QR)
7. POST /webhook/set/senorbot (reconfigura webhook)
8. Si hay QR, emite vía SSE: 'qrcode_updated'
9. Frontend muestra el nuevo QR
```

### Recepción de mensajes
```
1. Cliente envía mensaje desde su teléfono
2. Evolution API recibe vía Baileys
3. Webhook POST /api/chatbot/webhook { event: 'messages.upsert', data: {...} }
4. Backend procesa:
   a. Extrae remoteJid, messageText, pushName
   b. Ignora mensajes propios (fromMe = true)
   c. Ignora mensajes de grupo (@g.us)
   d. conversationService.saveIncomingMessage() → guarda en DB + emite SSE
   e. chatbotService.processMessage() → procesa respuesta
5. ChatbotService:
   a. Obtiene sesión (getOrCreateSession)
   b. Detecta intención
   c. Ejecuta handler según flow_state actual
   d. Envía respuesta via evolutionApiService.sendMessage()
   e. Guarda log en chatbot_log
   f. Actualiza flow_state
```

---

## 7. Flujo de Atención al Cliente

### Árbol de decisión

```
MENÚ PRINCIPAL
├── "1" → Stock completo
│         Muestra todo el inventario agrupado por producto
│         con cantidad por sucursal
│         Vuelve automáticamente al menú
│
├── "2" → Horarios y servicios
│         Muestra sucursales con horarios, direcciones y links
│         Servicios disponibles
│         Vuelve automáticamente al menú
│
├── "0" → Repite el menú
│
├── Palabras clave (stock, tinta, canon, epson, hp, producto, consultar)
│         → Consultar Stock por búsqueda
│           Ingresa nombre/marca → busca coincidencias
│           Muestra stock por sucursal (máx 3 productos)
│           Escribe "0" para volver al menú
│           Sigue preguntando hasta "0"
│
├── Palabras clave (horario, ubicación, sucursal, atención, services)
│         → Horarios (igual que opción 2)
│
├── Palabras clave (asistencia, empleado, entrada, salida, trabaj)
│         → Consultar Asistencia
│           Ingresa nombre del empleado → busca coincidencias
│           Muestra entrada/salida del día y resumen mensual
│           Escribe "0" para volver al menú
│           Sigue preguntando hasta "0"
│
└── Cualquier otra cosa → Repite el menú principal
```

---

## 8. Base de Datos - Entidades

### `whatsapp_session` (TintasDB)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `phone_number` | VARCHAR(20) PK | Número de teléfono del cliente |
| `profile_name` | VARCHAR(255) nullable | Nombre del contacto |
| `flow_state` | ENUM | Estado actual del flujo (MenuPrincipal, ConsultarStock, Horarios, ConsultarAsistencia, EsperandoOpcion) |
| `last_interaction` | TIMESTAMP | Última interacción |
| `last_message` | TEXT nullable | Último mensaje |
| `last_message_at` | TIMESTAMP nullable | Fecha último mensaje |
| `unread_count` | INT default 0 | Mensajes no leídos |
| `is_archived` | BOOLEAN default false | Conversación archivada |

### `whatsapp_message` (TintasDB)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | ID único |
| `created_by` | UUID nullable | Usuario creador |
| `phone_number` | VARCHAR(20) | Número del cliente |
| `from_me` | BOOLEAN | true = enviado por bot, false = recibido |
| `message_type` | ENUM | text, image, document, audio, video, button, list, unknown |
| `content` | TEXT nullable | Contenido del mensaje |
| `media_url` | VARCHAR nullable | URL del archivo multimedia |
| `wa_message_id` | VARCHAR nullable unique | ID del mensaje en WhatsApp |
| `timestamp` | TIMESTAMP | Fecha del mensaje |

### `chatbot_log` (TintasDB)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | ID único |
| `created_by` | UUID nullable | Usuario creador (del chatbot o SYSTEM_AUDIT_USER_ID) |
| `phone_number` | VARCHAR(20) | Número del cliente |
| `detected_intention` | ENUM | Consultar_Stock, Consultar_Horario, Consultar_Ubicacion, Consultar_Asistencia, Menu_Principal, Unknown |
| `user_message` | TEXT nullable | Mensaje del usuario |
| `bot_response` | TEXT nullable | Respuesta del bot |
| `timestamp` | TIMESTAMP | Fecha del log |

### `chatbot_log` FK
- Relación ManyToOne con `whatsapp_session` por `phone_number`
- ON DELETE CASCADE

### BaseEntity (clase abstracta)
Todas las entidades del proyecto extienden de esta clase:
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | ID generado automáticamente |
| `created_at` | TIMESTAMP | Fecha de creación |
| `created_by` | UUID | Usuario que creó |
| `updated_at` | TIMESTAMP | Fecha de actualización |
| `updated_by` | UUID nullable | Usuario que actualizó |
| `deleted_at` | TIMESTAMP nullable | Soft delete |
| `deleted_by` | UUID nullable | Usuario que eliminó |

> **Nota:** `whatsapp_session` NO extiende BaseEntity (usa `phone_number` como PK manual y no tiene soft delete/campos de auditoría). `whatsapp_message` y `chatbot_log` SÍ extienden BaseEntity.

---

## 9. Estado Actual

### ✅ Funcionando correctamente

- **Infraestructura Docker:** Todos los contenedores se inician y comunican correctamente
- **Evolution API v2.3.6:** Inicia, conecta con PostgreSQL y Redis, expone API en :8080
- **Backend NestJS:** Inicia, se conecta a TintasDB, se comunica con Evolution API
- **Webhook Evolution → Backend:** Configurado y funcional (se reciben eventos connection.update, qrcode.updated, messages.upsert)
- **QR Code generation:** Evolution API genera QR, webhook lo envía al backend, backend emite vía SSE
- **SSE Frontend:** El frontend se conecta al stream SSE y recibe eventos en tiempo real
- **Bot conversacional:** Funcional con menú, stock, horarios y asistencia
- **Persistencia:** Mensajes, sesiones y logs se guardan en TintasDB
- **Browser fingerprint:** Chrome (para evitar detección de cliente no oficial)

### ❌ Problemas conocidos

1. **QR scan no completa ("no se pudo vincular el dispositivo"):** WhatsApp rechaza la conexión vía Baileys. Posibles causas:
   - El servidor donde está alojado podría tener la IP bloqueada por WhatsApp
   - Baileys v2.3000.1040944432 podría estar en lista negra
   - La cuenta de WhatsApp podría tener restricciones
   - Se necesita probar con un proxy para las conexiones WebSocket de WhatsApp

2. **SSE sin reconexión:** `Connection.tsx` cierra `eventSource.onerror` sin reintentar conexión. Si hay un error de red o reinicio del backend, el frontend se queda sin eventos en tiempo real y muestra un QR obsoleto.

3. **Sin notificación de expiración de QR:** El frontend no muestra indicación de que el QR ha expirado. Evolution API genera nuevos QRs periódicamente pero el frontend solo actualiza si recibe un nuevo evento SSE.

### 🔧 Historial de cambios

| Fecha | Cambio | Motivo |
|-------|--------|--------|
| Jun 2026 | Eliminado `CONFIG_SESSION_PHONE_VERSION` | Causaba ciclo LOGOUT infinito (versión hardcodeada no coincidía con Baileys actual) |
| Jun 2026 | Agregado `CONFIG_SESSION_PHONE_NAME: "Chrome"` | Neutralizar fingerprint del navegador |
| Jun 2026 | Cambiado `CONFIG_SESSION_PHONE_CLIENT: "Chrome"` | Evitar que WhatsApp detecte "Evolution API" como cliente no oficial |
| Jun 2026 | `reconnectInstance()` usa `/instance/connect` en vez de `/instance/restart` | `/instance/restart` no devuelve QR en v2.3.6 |
| Jun 2026 | Reinicio de frontend_nginx tras recrear backend | Nginx cacheaba IP antigua del backend causando 502 |

### 📝 Notas técnicas

- **Baileys version:** 2.3000.1040944432
- **Browser string actual:** `Chrome,Chrome,6.10.14-linuxkit`
- **Instancia:** `senorbot`
- **Estado de conexión:** Siempre en `connecting` (nunca llega a `open`)
- **El webhook global está deshabilitado** (`WEBHOOK_GLOBAL_ENABLED: "false"`). Los webhooks se configuran por instancia desde `evolution-api.service.ts`
- **El timeout del webhook** está en 15 segundos para el cliente Axios del backend
- **La reconexión** elimina y recrea la instancia desde cero (no usa `/instance/restart`)
