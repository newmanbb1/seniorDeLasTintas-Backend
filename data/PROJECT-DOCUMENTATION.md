# El Señor de las Tintas - Documentación del Proyecto

> Documentación técnica completa del backend, orientado para consumo frontend.

---

## 📋 Resumen del Proyecto

**El Señor de las Tintas** es un sistema integral de gestión empresarial que incluye:

- **Gestión de Sucursales**: Control multisede con inventario independiente
- **Control de Personal**: Registro de asistencia con PIN
- **Chatbot de WhatsApp**: Atención automática 24/7
- **Gestión de Inventario**: Stock por sucursal con alertas de mínimo
- **Autenticación JWT**: Sistema de autenticación con tokens y auditoría

---

## 🛠️ Tecnologías del Proyecto

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Backend** | NestJS | 11.x |
| **ORM** | TypeORM | 0.3.x |
| **Base de Datos** | PostgreSQL | 15 |
| **Autenticación** | JWT + bcrypt | - |
| **WhatsApp API** | Evolution API | v2.3.6 |
| **Documentación** | Swagger/OpenAPI | - |
| **Contenedores** | Docker + Compose | - |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (PWA/Web)                         │
│              Panel Admin | PWA Empleados | WhatsApp            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND NESTJS                            │
│                   http://localhost:3000                         │
│                                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Auth   │ │ Branch  │ │Employee │ │Supply   │ │Inventory│  │
│  │ Module  │ │ Module  │ │ Module  │ │ Module  │ │ Module  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────────────┐  │
│  │ Stock Transfer│ │ Attendance   │ │ Chatbot              │  │
│  │ Module        │ │ Module       │ │ Module               │  │
│  └──────────────┘ └───────────────┘ └──────────────────────┘  │
│                                                                │
│  ┌──────────────┐                                             │
│  │ Seed        │                                             │
│  │ Module      │                                             │
│  └──────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BASES DE DATOS                            │
│                                                                │
│  ┌─────────────────────┐    ┌─────────────────────┐           │
│  │   evolution_db     │    │    backend_db       │           │
│  │   (PostgreSQL)     │    │    (PostgreSQL)     │           │
│  └─────────────────────┘    └─────────────────────┘           │
│           │                           │                       │
│           │                           │                       │
│  ┌────────┴────────┐         ┌───────┴───────┐              │
│  │ Evolution API    │         │ Tablas Negocio│              │
│  │ WhatsApp         │         │ (10 entidades)│              │
│  └─────────────────┘         └───────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Módulos

```
src/
├── common/                          → Utilidades compartidas
│   ├── entities/
│   │   └── BaseEntity.ts            → Entidad base con auditoría
│   ├── decorators/                  → Decoradores (@Roles, @GetUser)
│   ├── guards/                     → Guards (JWT, Roles, AllowAnonymous)
│   ├── strategies/                  → Estrategias JWT
│   ├── dto/
│   │   └── PaginationDto.ts         → DTO de paginación
│   ├── response/                    → Respuestas estandarizadas
│   └── filters/                     → Filtros de excepciones
│
└── modules/
    ├── auth/            → Autenticación JWT + Refresh Tokens
    ├── seed/            → Seed de datos de ejemplo
    ├── uploads/         → Subir imágenes y videos
    ├── branch/          → Gestión de sucursales
    ├── employee/        → Gestión de empleados
    ├── supply/          → Catálogo de insumos
    ├── inventory/       → Inventario por sucursal
    ├── stock-transfer/  → Traspasos entre sucursales
    ├── attendance/     → Registro de asistencia
    └── chatbot/        → Chatbot de WhatsApp
```

---

## 🔐 Sistema de Autenticación

### Tipos de Usuarios

| Tipo | Método de Login | Acceso |
|------|-----------------|--------|
| **Admin** | Email + Password (JWT) | Panel administrativo completo |
| **Secretaria** | Email + Password (JWT) | Solo su sucursal asignada |
| **Empleado** | Solo PIN (JWT limitado) | Solo check-in/check-out |

### Flujo de Login Admin

```
1. Frontend → POST /auth/login
   Body: { "email": "admin@...", "password": "admin123" }

2. Backend:
   - Busca usuario por email
   - Valida password con bcrypt
   - Genera access_token (15 min) + refresh_token (7 días)
   - Guarda refresh_token en BD (hashed)

3. Respuesta exitosa:
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "user": { "id": "...", "full_name": "...", "role": "admin" }
  }
}
```

### Flujo de Login Empleado (PIN)

```
1. Frontend → POST /auth/login-pin
   Body: { "pin": "1234" }
   └─ Limitado a 5 intentos por minuto (rate limiting)

2. Backend:
   - Obtiene todos los empleados activos
   - Itera con bcrypt.compare(pin, employee.access_pin) hasta encontrar match
   - Si no hay match → 401 Unauthorized
   - Si hay match → genera access_token con employee_id

3. Respuesta exitosa:
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "employee_id": "uuid-empleado",
    "employee_name": "Juan Pérez",
    "branch_name": "Sucursal Centro"
  }
}
```

### Renovación de Token (Refresh)

```
1. Frontend → POST /auth/refresh
   Header: Authorization: Bearer <refresh_token>
   Body: { "refresh_token": "eyJhbG..." }

2. Backend:
   - Verifica refresh_token válido
   - Revoca el token antiguo
   - Genera nuevos tokens
```

### Estructura del JWT

**Access Token (15 minutos) — payload firmado:**
```json
{
  "sub": "uuid-del-usuario",
  "id": "uuid-del-usuario",
  "email": "admin@email.com",
  "role": "admin",
  "type": "access",
  "iat": 1715780000,
  "exp": 1715780900
}
```

**Access Token (login con PIN de empleado):**
```json
{
  "sub": "uuid-del-empleado",
  "id": "uuid-del-empleado",
  "email": "employee-uuid-del-empleado",
  "role": "employee",
  "type": "employee",
  "employee_id": "uuid-del-empleado"
}
```

**Refresh Token (7 días) — payload firmado:**
```json
{
  "sub": "uuid-del-usuario",
  "id": "uuid-del-usuario",
  "email": "admin@email.com",
  "role": "admin",
  "type": "refresh"
}
```

**Token de Secretaria (incluye branch_id):**
```json
{
  "sub": "uuid-usuario",
  "id": "uuid-usuario",
  "email": "secretaria@email.com",
  "role": "secretaria",
  "type": "access",
  "branch_id": "uuid-sucursal-asignada"
}
```

### Uso del Token en Frontend

```javascript
// Guardar token después del login
localStorage.setItem('access_token', response.data.access_token);
localStorage.setItem('refresh_token', response.data.refresh_token);

// Incluir en headers de peticiones
const token = localStorage.getItem('access_token');
fetch('/branch', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 🗄️ Modelo de Entidades

### Entidades de Negocio

| Entidad | Tabla DB | Módulo | Descripción |
|---------|-----------|--------|-------------|
| **User** | `user` | `auth` | Administradores del sistema |
| **RefreshToken** | `refresh_token` | `auth` | Tokens de renovación |
| **Branch** | `branch` | `branch` | Sucursales del negocio |
| **Employee** | `employee` | `employee` | Personal empleado |
| **Supply** | `supply` | `supply` | Catálogo de insumos (con `is_active`, `umbral_min`) |
| **Inventory** | `inventory` | `inventory` | Stock por sucursal |
| **StockTransfer** | `stock_transfer` | `stock-transfer` | Traspasos de mercadería |
| **Attendance** | `attendance` | `attendance` | Registro de asistencia |

### Entidades del Chatbot

| Entidad | Tabla DB | Módulo | Descripción |
|---------|-----------|--------|-------------|
| **WhatsAppSession** | `whatsapp_session` | `chatbot` | Sesiones activas de WhatsApp (incluye flow_state, unread_count, is_archived) |
| **WhatsAppMessage** | `whatsapp_message` | `chatbot` | Historial de mensajes (texto, imágenes, documentos) |
| **ChatbotLog** | `chatbot_log` | `chatbot` | Auditoría de interacciones (intención detectada, respuesta) |

---

## 📊 Detalle de Entidades

> ⚠️ **Nota**: Todas las entidades heredan de `BaseEntity` e incluyen automáticamente:
> - `id` (UUID)
> - `created_at`, `created_by`
> - `updated_at`, `updated_by`
> - `deleted_at`, `deleted_by` (soft delete)
>
> **Soft Delete:** El borrado lógico se realiza con `update({ id }, { deleted_at: new Date(), deleted_by: userId })` atómico. NO se usa `softDelete() + save()` porque `save()` sobrescribe `deleted_at` con `null`.
>
> **Auditoría:** Todos los servicios reciben `userId: string` directamente del JWT (`@GetUser('id')`) y lo escriben en los campos `created_by`/`updated_by`/`deleted_by`. Única excepción: check-in/check-out (público) usan `SYSTEM_AUDIT_USER_ID`.

---

### 1. User (Usuario/Admin)

```typescript
{
  id: string;              // UUID
  email: string;           // Email único
  password: string;       // Password hash bcrypt
  full_name: string;      // Nombre completo
  role: enum;              // 'admin'
  active: boolean;         // Estado activo
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  deleted_at?: Date;
  deleted_by?: string;
}
```

---

### 2. RefreshToken (Token de Renovación)

```typescript
{
  id: string;              // UUID
  user_id: string;         // FK → User
  token: string;           // Token hasheado
  expires_at: Date;        // Fecha de expiración
  revoked: boolean;       // Token revocado
  created_at: Date;
  created_by: string;
}
```

---

### 3. Branch (Sucursal)

```typescript
{
  id: string;              // UUID
  name: string;            // Nombre de la sucursal
  address: string;         // Dirección
  opening_hours: string;   // Horarios de atención
  location_link: string;   // Link de Google Maps
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  deleted_at?: Date;
  deleted_by?: string;
}
```

**Relaciones:**
- `1:N` con Inventory
- `1:N` con Employee
- `1:N` con StockTransfer (origen)
- `1:N` con StockTransfer (destino)

---

### 4. Employee (Empleado)

```typescript
{
  id: string;              // UUID
  branch_id: string;       // FK → Branch
  full_name: string;       // Nombre completo
  access_pin: string;       // PIN de acceso (4-6 dígitos)
  position: string;         // Cargo/Puesto
  active: boolean;         // Estado activo/inactivo
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  deleted_at?: Date;
  deleted_by?: string;
}
```

**Relaciones:**
- `N:1` con Branch
- `1:N` con Attendance

---

### 5. Supply (Insumo)

```typescript
{
  id: string;              // UUID
  name: string;            // Nombre del insumo
  category: string;        // Categoría (ej: "Tintas", "Repuestos")
  unit_of_measure: string; // Unidad (ej: "litros", "unidades")
  is_active: boolean;      // Visible en el sistema (default: true)
  umbral_min: number | null; // Umbral mínimo crítico global (opcional)
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  deleted_at?: Date;
  deleted_by?: string;
}
```

**Notas:**
- `is_active`: Permite ocultar insumos del catálogo sin borrarlos
- `umbral_min`: Umbral crítico global. Si está definido, se usa como límite para alertas de stock crítico en TODAS las sucursales. Si es `null`, se usa `inventory.minimum_stock` como fallback.
- El frontend evalúa: `COALESCE(supply.umbral_min, inventory.minimum_stock, 0)` para alertas

**Relaciones:**
- `1:N` con Inventory
- `1:N` con StockTransfer

---

### 6. Inventory (Inventario)

```typescript
{
  id: string;              // UUID
  branch_id: string;       // FK → Branch
  supply_id: string;       // FK → Supply
  current_quantity: number; // Stock actual
  minimum_stock: number;   // Stock mínimo para alertas
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  deleted_at?: Date;
  deleted_by?: string;
}
```

**Restricciones:**
- Unique: `(branch_id, supply_id)`

---

### 7. StockTransfer (Traspaso)

```typescript
{
  id: string;              // UUID
  origin_branch_id: string;    // FK → Branch (origen)
  destination_branch_id: string; // FK → Branch (destino)
  supply_id: string;       // FK → Supply
  quantity: number;         // Cantidad a trasladar
  request_date: Date;       // Fecha de solicitud
  reception_date: Date;     // Fecha de recepción (nullable)
  status: enum;             // in_transit | received | rejected
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  deleted_at?: Date;
  deleted_by?: string;
}
```

---

### 8. Attendance (Asistencia)

```typescript
{
  id: string;              // UUID
  employee_id: string;    // FK → Employee
  register_date: string;   // Fecha (YYYY-MM-DD)
  check_in: Date;          // Hora de entrada
  check_out: Date;         // Hora de salida (nullable)
  check_in_status: enum;   // punctual | late | absence
  hours_worked: string;    // Horas trabajadas (decimal)
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  deleted_at?: Date;
  deleted_by?: string;
}
```

---

### 9. WhatsAppSession (Sesión WhatsApp)

```typescript
{
  phone_number: string;    // PK - Número de teléfono
  profile_name: string;    // Nombre del contacto
  flow_state: enum;        // Estado del flujo conversacional
  last_interaction: Date;  // Última interacción
  last_message: string;    // Último mensaje visto en conversación
  last_message_at: Date;   // Timestamp del último mensaje
  unread_count: number;    // Mensajes no leídos por el admin
  is_archived: boolean;    // Conversación archivada/oculta
}
```

> ⚠️ Esta entidad NO hereda de BaseEntity porque su PK es el número de teléfono.

---

### 10. ChatbotLog (Log del Chatbot)

```typescript
{
  id: string;              // UUID - Heredado de BaseEntity
  phone_number: string;    // Teléfono del cliente
  detected_intention: enum; // Intención detectada
  user_message: string;   // Mensaje del usuario
  bot_response: string;   // Respuesta del bot
  timestamp: Date;        // Fecha/hora del log
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  deleted_at?: Date;
  deleted_by?: string;
}
```

---

## 🔗 Relaciones entre Entidades

```
                    ┌──────────────┐
                    │     User     │  (Admin)
                    │   (auth)     │
                    └──────────────┘
                           │
                    created_by, updated_by, deleted_by
                           │
                           ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                      RELACIONES                             │
    ├─────────────┬─────────────┬──────────────┬──────────────────┤
    │             │             │              │                  │
    ▼             ▼             ▼              ▼                  ▼
┌─────────┐  ┌─────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐
│ Branch  │  │ Supply  │  │ Employee  │  │ StockTrans │  │Inventory│
└────┬────┘  └────┬────┘  └─────┬─────┘  └─────┬──────┘  └────┬─────┘
     │            │             │              │              │
     │            │        branch_id         origin_       branch_id
     │            │                           destination   supply_id
     │            │                           supply_id
     │            │              ┌───────────┘
     │            │              │
     │            │         ┌────▼────┐
     │            │         │Attendance│
     │            │         │employee_id│
     │            │         └──────────┘
     │            │
     └─────┬──────┘
           │
           ▼
    ┌──────────────┐
    │  Inventory   │
    │ branch_id    │
    │ supply_id    │
    └──────────────┘
```

---

## 🛡️ Medidas de Seguridad

El backend implementa las siguientes medidas de seguridad para proteger la aplicación:

### Rate Limiting (Límite de Peticiones)

| Nivel | Límite | Ventana | Endpoints |
|-------|--------|---------|-----------|
| `short` | 10 req | 1 segundo | Global (todos) |
| `medium` | 50 req | 10 segundos | Global (todos) |
| `long` | 100 req | 1 minuto | Global (todos) |
| `login-pin` | 5 req | 1 minuto | `POST /auth/login-pin` |
| `check-in/out` | 10 req | 1 minuto | `POST /attendance/check-in`, `POST /attendance/check-out` |

Si superas el límite, recibirás error `429 Too Many Requests`.

### PINs hasheados con bcrypt

Los PINs de empleados **nunca se almacenan en texto plano**:

```
Creación:  bcrypt.hash(pin, 10) → guardar hash en BD
Verificación: bcrypt.compare(pin, hash) → true/false
```

- En `employee.service.ts`: se hashea el PIN al crear o actualizar empleado
- En `attendance.service.ts`: se usa `bcrypt.compare()` en check-in y check-out
- En `auth.service.ts`: se usa `bcrypt.compare()` en login-pin (recorre empleados activos)
- En `seed.service.ts`: los PINs del seed también se hashean antes de guardar

### Sin fallbacks hardcodeados de secrets

El backend lanza **error de inicio** si falta una variable crítica:

| Variable | Si falta... |
|----------|-------------|
| `JWT_SECRET` | Error: "JWT_SECRET no configurado en variables de entorno" |
| `EVOLUTION_API_KEY` | Error: "EVOLUTION_API_KEY no configurado en variables de entorno" |
| `DB_HOST/DB_USERNAME/DB_PASSWORD/DB_NAME` | Error: "Faltan variables de entorno de la base de datos" |

No hay valores por defecto inseguros (`'default-secret-key'`, `'fixed-api-key-12345'`, etc.).  
El archivo `.env` **no está trackeado en git** — usar `.env.example` como plantilla.

### WebhookAuthGuard (x-webhook-secret)

Los 9 endpoints webhook de chatbot (`POST /api/chatbot/webhook*`) están protegidos con un guard que verifica el header `x-webhook-secret`:

```
Request → ¿Header x-webhook-secret coincide con WEBHOOK_SECRET?
  ├── Sí → Procesar webhook
  └── No → 401 Unauthorized
```

Evolution API se configura automáticamente para enviar el header al registrar los webhooks.

### Mapeo explícito de campos (sin Object.assign)

Todos los `update()` en servicios usan **asignación explícita campo por campo** en lugar de `Object.assign(entity, dto)`, evitando que campos no permitidos del DTO sobrescriban propiedades sensibles de la entidad.

| Servicio | Antes | Después |
|----------|-------|---------|
| employee | `Object.assign(employee, dto)` | `employee.full_name = dto.full_name; employee.access_pin = ...` |
| attendance | `Object.assign(attendance, dto)` | Solo actualiza `updated_by` |
| supply | `Object.assign(supply, dto)` | `supply.name = dto.name; supply.category = ...` |
| branch | `Object.assign(branch, dto)` | `branch.name = dto.name; branch.address = ...` |
| inventory | `Object.assign(inventory, dto)` | `inventory.current_quantity = dto.current_quantity; ...` |

### Headers de Seguridad (Helmet)

- Content-Security-Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)

### CORS Configurado

Orígenes permitidos configurables mediante variable `CORS_ORIGIN`:
```env
CORS_ORIGIN=http://localhost:3001,http://localhost:5173
```

### Swagger en Producción

La documentación Swagger (`/docs`) solo está disponible en entorno de desarrollo (`NODE_ENV !== 'production'`).

### Patrón de Soft Delete

Todos los DELETE del sistema son **borrado lógico** (soft delete). No se eliminan registros de la BD.

**Cómo funciona:**
```typescript
// En lugar de:
await this.repository.softDelete(id)  // ❌ No usar

// Se usa:
await this.repository.update(
  { id },
  { deleted_at: new Date(), deleted_by: userId }  // ✅ Atómico
)
```

**Por qué:** El método `softDelete()` + `save()` provoca que `save()` sobrescriba `deleted_at` con `null`, anulando el borrado. La solución es usar `update()` que establece `deleted_at` y `deleted_by` en una sola operación.

**Filtrado en consultas:** Todos los `findOne()` en servicios incluyen `deleted_at: IsNull()` para excluir registros eliminados.

### Auditoría (created_by / updated_by / deleted_by)

Todos los servicios que modifican datos escriben el ID del usuario autenticado directamente en los campos de auditoría:

```typescript
// Ejemplo en un servicio:
async create(dto: CreateDto, userId: string) {
  return this.repository.save({
    ...dto,
    created_by: userId,   // ✅ Directo desde @GetUser('id')
    updated_by: userId,
  });
}
```

**Excepción:** Los endpoints públicos `/attendance/check-in` y `/attendance/check-out` no tienen usuario autenticado, por lo que usan `SYSTEM_AUDIT_USER_ID` (variable de entorno).

**Flujo:**
1. El JWT incluye `id` (mapeado desde `sub` en JwtStrategy)
2. El controlador extrae el ID con `@GetUser('id')`
3. Pasa `userId` al servicio
4. El servicio lo escribe en `created_by` / `updated_by` / `deleted_by`

No se usa `getAuditUserId()` como fallback — si no hay usuario autenticado, el endpoint no debería modificar datos (excepto check-in/check-out).

---

## ⚡ Idempotencia en Transferencias

El endpoint `/api/inventory/transfer` implementa protección contra duplicados accidentales.

### Cómo funciona

El servidor genera automáticamente un `idempotency_key` basado en los parámetros de la transferencia:

```
SHA256(origin_branch_id:destination_branch_id:supply_id:quantity)
```

### Respuestas

**Primera ejecución (normal):**
```json
{
  "success": true,
  "data": {
    "transfer_id": "uuid-generado",
    "idempotency_key": "a1b2c3d4e5f6...",
    "idempotency_replayed": false,
    "supply_name": "Tinta Canon",
    "origin_branch": "Sucursal A",
    "destination_branch": "Sucursal B",
    "quantity": 10,
    "previous_origin_quantity": 50,
    "new_origin_quantity": 40,
    "previous_destination_quantity": 20,
    "new_destination_quantity": 30
  }
}
```

**Reintento con mismos datos (bloqueado):**
```json
{
  "success": true,
  "data": {
    "transfer_id": "uuid-generado",
    "idempotency_key": "a1b2c3d4e5f6...",
    "idempotency_replayed": true,
    "message": "Transferencia ya ejecutada previamente"
  }
}
```

### Para el Frontend

Si tu aplicación hace reintentos automáticos por errores de red, el backend detectará si la transferencia ya fue procesada y retornará el resultado anterior en lugar de ejecutarla de nuevo.

---

## 📡 Endpoints de la API

### Base URL
```
http://localhost:3000
```

### Documentación Interactiva
```
http://localhost:3000/docs
```

---

> ⚠️ **IMPORTANTE**: Todos los endpoints tienen el prefijo `/api`
> 
> Ejemplo: `http://localhost:3000/api/auth/login`
> 
> **Rutas base:**
> - Desarrollo: `http://localhost:3000/api`
> - Producción: `http://tu-dominio.com/api`

---

## 📡 Endpoints API

Todos los endpoints requieren el prefijo `/api`

### 1. Auth (Autenticación)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar admin | ❌ Público |
| POST | `/api/auth/login` | Login admin (email + password) | ❌ Público |
| POST | `/api/auth/login-pin` | Login empleado (solo PIN) | ❌ Público |
| POST | `/api/auth/refresh` | Renovar access token | ❌ Público |
| POST | `/api/auth/logout` | Cerrar sesión | ✅ JWT |
| POST | `/api/auth/register-secretaria` | Crear secretaria (solo admin) | ✅ JWT |
| GET | `/api/auth/profile` | Perfil del usuario actual | ✅ JWT |
| GET | `/api/auth/secretarias` | Listar todas las secretarias (solo admin) | ✅ ADMIN |

**Registro de admin:**
```json
POST /api/auth/register
{
  "email": "admin@senordelastintas.com",
  "password": "admin123",
  "full_name": "Administrador Principal"
}
```

**Body login admin:**
```json
{
  "email": "admin@senordelastintas.com",
  "password": "admin123"
}
```

**Body login-pin:**
```json
{
  "pin": "1234"
}
```

**Body refresh:**
```json
{
  "refresh_token": "eyJhbG..."
}
```

**Body register-secretaria:**
```json
POST /api/auth/register-secretaria
Authorization: Bearer <admin_token>

{
  "email": "secretaria@email.com",
  "password": "password123",
  "full_name": "María Secretaria",
  "branch_id": "uuid-sucursal-asignada"
}
```

---

### 2. Seed (Datos de Prueba)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/seed/status` | Verificar estado de la BD | ❌ Público |
| POST | `/api/seed/all` | Ejecutar seed (inserta datos) | ✅ ADMIN |
| POST | `/api/seed/reset` | Limpiar datos y reinstallar | ✅ ADMIN |

---

### 3. Branch (Sucursales)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/branch` | Crear sucursal | ✅ Admin |
| GET | `/api/branch?limit=10&offset=0&name=&address=` | Listar con filtros | ✅ Admin/Secretaria |
| GET | `/api/branch/:id` | Obtener por ID | ✅ Admin/Secretaria |
| PATCH | `/api/branch/:id` | Actualizar sucursal | ✅ Admin |
| DELETE | `/api/branch/:id` | Eliminar (soft delete) | ✅ Admin |

**Body crear sucursal:**
```json
POST /api/branch
{
  "name": "Sucursal Centro",
  "address": "Av. Principal #123, Centro",
  "opening_hours": "Lun-Sáb: 9:00-20:00, Dom: 10:00-18:00",
  "location_link": "https://maps.google.com/?q=19.4326,-99.1332"
}
```

**Body actualizar sucursal:**
```json
PATCH /api/branch/:id
{
  "name": "Sucursal Centro (Renovada)",
  "opening_hours": "Lun-Sáb: 8:00-21:00"
}
```

---

### 4. Employee (Empleados)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/employee` | Crear empleado | ✅ Admin/Secretaria |
| GET | `/api/employee?limit=10&offset=0&full_name=&position=&branch_id=&active=` | Listar con filtros | ✅ Admin/Secretaria |
| GET | `/api/employee/:id` | Obtener por ID | ✅ Admin/Secretaria |
| PATCH | `/api/employee/:id` | Actualizar empleado | ✅ Admin/Secretaria |
| PATCH | `/api/employee/:id/toggle-active` | Activar/Desactivar | ✅ Admin/Secretaria |
| DELETE | `/api/employee/:id` | Eliminar (soft delete) | ✅ Admin |

**Body crear empleado:**
```json
POST /api/employee
{
  "full_name": "Juan Pérez",
  "access_pin": "1234",
  "position": "Vendedor",
  "branch_id": "uuid-sucursal",
  "active": true
}
```

**Body actualizar empleado:**
```json
PATCH /api/employee/:id
{
  "full_name": "Juan Carlos Pérez",
  "position": "Encargado de ventas"
}
```

---

### 5. Supply (Insumos - Catálogo Central)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/supply` | Crear insumo | ✅ Admin |
| GET | `/api/supply?limit=10&offset=0&name=&category=` | Listar con filtros | ✅ Admin/Secretaria |
| GET | `/api/supply/:id` | Obtener por ID | ✅ Admin/Secretaria |
| PATCH | `/api/supply/:id` | Actualizar insumo | ✅ Admin |
| DELETE | `/api/supply/:id` | Eliminar (soft delete) | ✅ Admin |

**Body crear insumo:**
```json
POST /api/supply
{
  "name": "Tinta Canon PG-510",
  "category": "Tintas",
  "unit_of_measure": "unidades",
  "is_active": true,
  "umbral_min": 5
}
```

- `is_active` (boolean, opcional): default `true`
- `umbral_min` (number | null, opcional): default `null`. Si se define, las alertas de stock crítico compararán contra este valor en lugar de `minimum_stock`

**Body actualizar insumo:**
```json
PATCH /api/supply/:id
{
  "name": "Tinta Canon PG-510 (Negro)",
  "category": "Tintas Originales"
}
```

---

### 6. Inventory (Inventario)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/inventory` | Crear registro de inventario | ✅ Admin/Secretaria |
| GET | `/api/inventory?limit=10&offset=0&branch_id=&supply_id=&low_stock=` | Listar con filtros | ✅ Admin/Secretaria |
| GET | `/api/inventory/alerts` | Alertas de stock crítico (usa `umbral_min` → `minimum_stock`) | ✅ Admin/Secretaria |
| GET | `/api/inventory/:id` | Obtener por ID | ✅ Admin/Secretaria |
| PATCH | `/api/inventory/:id` | Actualizar inventario | ✅ Admin/Secretaria |
| PATCH | `/api/inventory/:id/adjust` | Ajustar cantidad (±) | ✅ Admin/Secretaria |
| POST | `/api/inventory/transfer` | **TRASPASO 1 PAGO (ATÓMICO)** | ✅ Admin/Secretaria |
| DELETE | `/api/inventory/:id` | Eliminar (soft delete) | ✅ Admin |

**GET /api/inventory/alerts** — Retorna items con `current_quantity <= umbral_min` (si existe) o `current_quantity <= minimum_stock`. ADMIN ve todas las sucursales, SECRETARIA solo su sucursal. Incluye `supply_name`, `branch_name`, `current_quantity`, `minimum_stock`, `umbral_min`.

**Body crear inventario:**
```json
POST /api/inventory
{
  "branch_id": "uuid-sucursal",
  "supply_id": "uuid-insumo",
  "current_quantity": 50,
  "minimum_stock": 10
}
```

**Body ajustar cantidad:**
```json
PATCH /api/inventory/:id/adjust
{
  "adjustment": -5
}
```

**Body transferencia atómica (RECOMENDADO):**
```json
POST /api/inventory/transfer
{
  "origin_branch_id": "uuid-sucursal-origen",
  "destination_branch_id": "uuid-sucursal-destino",
  "supply_id": "uuid-insumo",
  "quantity": 10
}
```

**Respuesta de transferencia:**
```json
{
  "success": true,
  "data": {
    "transfer_id": "uuid-generado",
    "idempotency_key": "a1b2c3d4e5f6...",
    "idempotency_replayed": false,
    "supply_name": "Tinta Canon PG-510",
    "origin_branch": "Sucursal Centro",
    "destination_branch": "Sucursal Norte",
    "quantity": 10,
    "previous_origin_quantity": 50,
    "new_origin_quantity": 40,
    "previous_destination_quantity": 20,
    "new_destination_quantity": 30
  }
}
```

---

### 7. StockTransfer (Traspasos - 2 Pasos)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/stock-transfer` | Crear traspaso | ✅ Admin |
| GET | `/api/stock-transfer?limit=10&offset=0&origin_branch_id=&destination_branch_id=&status=` | Listar con filtros | ✅ Admin/Secretaria |
| GET | `/api/stock-transfer/:id` | Obtener por ID | ✅ Admin/Secretaria |
| PATCH | `/api/stock-transfer/:id` | Actualizar (solo si InTransit) | ✅ Admin |
| POST | `/api/stock-transfer/:id/receive` | Confirmar recepción | ✅ Admin |
| POST | `/api/stock-transfer/:id/reject` | Rechazar traspaso | ✅ Admin |
| DELETE | `/api/stock-transfer/:id` | Eliminar | ✅ Admin |

---

### 8. Attendance (Asistencia)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/attendance/check-in` | Registrar entrada (PIN) | ❌ Público |
| POST | `/api/attendance/check-out` | Registrar salida (PIN) | ❌ Público |
| GET | `/api/attendance?limit=10&offset=0&employee_id=&register_date=&check_in_status=&branch_id=` | Listar con filtros | ✅ Admin/Secretaria |
| GET | `/api/attendance/:id` | Obtener por ID | ✅ Admin/Secretaria |
| GET | `/api/attendance/report/employee/:employee_id?start_date=&end_date=` | Reporte por empleado | ✅ Admin/Secretaria |
| PATCH | `/api/attendance/:id` | Actualizar (admin) | ✅ Admin |
| DELETE | `/api/attendance/:id` | Eliminar (soft delete) | ✅ Admin |

**Body para check-in/check-out:**
```json
{
  "employee_id": "uuid-del-empleado",
  "pin": "1234"
}
```

---

### 9. Uploads (Imágenes y Videos)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/uploads/images` | Subir imagen (max 5MB) | ✅ JWT + Roles (ADMIN, SECRETARIA) |
| POST | `/api/uploads/videos` | Subir video (max 50MB) | ✅ JWT + Roles (ADMIN, SECRETARIA) |
| GET | `/api/uploads/images/supplies/:filename` | Ver imagen | ✅ Público |
| GET | `/api/uploads/videos/supplies/:filename` | Ver video | ✅ Público |

**Formatos permitidos:**
- Imágenes: jpg, jpeg, png, webp, gif
- Videos: mp4, webm, mov

**Medidas de seguridad en subidas:**

| Protección | Descripción |
|------------|-------------|
| **Magic bytes** | Valida los primeros bytes del archivo (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, etc.) después de escribir a disco. Rechaza archivos con extensión falsa. |
| **Extensión por mimetype** | El nombre guardado usa un mapa `mimetype → extensión` (ej: `image/jpeg` → `.jpg`), NO `extname(originalname)`. |
| **Multer fileFilter** | Rechazo temprano por mimetype inválido antes de escribir a disco. |
| **Path traversal** | En GET, se sanitiza el filename eliminando `..` y `/` para evitar lectura de archivos fuera del directorio. |

**Subir imagen (Headers requeridos):**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body (form-data):**
- Key: `file`
- Value: [Seleccionar archivo]

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "filename": "1234567890-abc.jpg",
    "url": "/uploads/images/supplies/1234567890-abc.jpg",
    "size": 102400,
    "mimetype": "image/jpeg"
  }
}
```

**Ver imagen/video (Público - sin auth):**
```
GET http://localhost:3000/uploads/images/supplies/1234567890-abc.jpg
```

**Ejemplo de subida con JavaScript:**
```javascript
// Subir imagen
async function uploadImage(file) {
  const token = localStorage.getItem('access_token');
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/uploads/images', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Error al subir imagen');
  }
  
  const { data } = await response.json();
  return data.url; // URL de la imagen subida
}

// Uso con input de archivo:
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const url = await uploadImage(file);
      console.log('Imagen subida:', url);
      // Mostrar preview
      document.querySelector('#preview').src = url;
    } catch (error) {
      console.error('Error:', error);
    }
  }
});
```

---

### 10. Chatbot (WhatsApp)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/chatbot/webhook` | Webhook principal de Evolution API | ❌ Público |
| POST | `/api/chatbot/webhook/messages-upsert` | Webhook para nuevos mensajes | ❌ Público |
| POST | `/api/chatbot/webhook/messages-update` | Webhook para actualización de mensajes | ❌ Público |
| POST | `/api/chatbot/webhook/chats-upsert` | Webhook para nuevos chats | ❌ Público |
| POST | `/api/chatbot/webhook/chats-update` | Webhook para actualización de chats | ❌ Público |
| POST | `/api/chatbot/webhook/contacts-update` | Webhook para actualización de contactos | ❌ Público |
| POST | `/api/chatbot/webhook/connection-update` | Webhook para conexión/desconexión | ❌ Público |
| POST | `/api/chatbot/webhook/qrcode-updated` | Webhook para código QR actualizado | ❌ Público |
| POST | `/api/chatbot/webhook/presence-update` | Webhook para cambio de presencia | ❌ Público |
| GET | `/api/chatbot/logs?limit=10&offset=0&phone_number=&detected_intention=` | Logs de interacción | ❌ Público |
| POST | `/api/chatbot/test` | Mensaje de prueba | ✅ JWT + ADMIN |

**Nota sobre seguridad de webhooks:**
- Los 9 endpoints `POST /api/chatbot/webhook*` están protegidos por `WebhookAuthGuard` que verifica el header `x-webhook-secret`.
- Evolution API se configura automáticamente para enviar el secret al registrar los webhooks.
- Si el header no coincide con `WEBHOOK_SECRET` del `.env`, el backend responde `401 Unauthorized`.

**Nota:** El endpoint `/chatbot/test` requiere token JWT con rol de ADMIN. Esto es para que solo el administrador pueda enviar mensajes de prueba.

---

## 🤖 Chatbot de WhatsApp - Guía Completa

### Descripción General

El chatbot de WhatsApp permite a los clientes consultar información del negocio sin intervención humana. El sistema está disponible **24/7** y responde automáticamente a cualquier mensaje recibido.

### Arquitectura del Chatbot

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  WhatsApp       │──────│  Evolution API  │──────│  Backend NestJS │
│  (Usuario)      │      │  (Webhooks)      │      │  (Chatbot)       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                                              │
                                                              ▼
                                                  ┌─────────────────────┐
                                                  │  PostgreSQL         │
                                                  │  (Datos del negocio)│
                                                  └─────────────────────┘
```

### Configuración de Evolution API

#### Variables de Entorno (.env)

```env
# Evolution API - Panel Manager (autenticación)
EVOLUTION_API_KEY=fixed-api-key-12345

# Evolution API - Instancia (para enviar mensajes)
# IMPORTANTE: Esta key se genera al crear la instancia
INSTANCE_API_KEY=2FF39E0A-9FC4-41A3-A6E5-03ED7DD33360

# Nombre de la instancia
INSTANCE_NAME=senorbot

# URL de Evolution API
EVOLUTION_URL=http://evolution:8080
```

> **⚠️ Importante**: La `INSTANCE_API_KEY` se genera al crear la instancia y no debe cambiarse. Si se elimina la instancia, se generará una nueva API key y deberá actualizarse en el `.env`.

#### Docker Compose

```yaml
evolution:
  image: evoapicloud/evolution-api:v2.3.6
  environment:
    # Webhook global para todos los eventos
    WEBHOOK_GLOBAL_ENABLED: "true"
    WEBHOOK_GLOBAL_URL: "http://backend:3000/chatbot/webhook"
    WEBHOOK_GLOBAL_BY_EVENTS: "true"
    WEBHOOK_EVENTS_ON_MESSAGES_UPSERT: "true"
    # Auth
    AUTHENTICATION_API_KEY: "fixed-api-key-12345"
```

### Flujo de Funcionamiento Paso a Paso

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FLUJO DEL CHATBOT                                      │
└─────────────────────────────────────────────────────────────────────────────┘

1. USUARIO ENVÍA MENSAJE
   └─→ WhatsApp → Evolution API

2. EVOLUTION API RECIBE EL MENSAJE
   └─→ Detecta tipo: messages.upsert
   └─→ Envía webhook a: http://backend:3000/chatbot/webhook/messages-upsert

3. BACKEND PROCESA EL WEBHOOK
   └─→ Extrae datos del mensaje:
       - remoteJid (número de teléfono)
       - pushName (nombre del contacto)
       - message.conversation (texto del mensaje)
       - key.fromMe (si es mensaje propio o del bot)
   └─→ Valida que no sea mensaje de grupo (@g.us)
   └─→ Detecta la intención del mensaje

4. DETECCIÓN DE INTENCIÓN
   └─→ Si el usuario envía palabras clave:
       - "stock", "tinta", "canon", "epson", "hp" → Consultar_Stock
       - "horario", "atención", "ubicación" → Consultar_Horario
       - "asistencia", "empleado" → Consultar_Asistencia
       - "0" → Regresa al menú principal
       - Cualquier número (1, 2) → Menu_Principal

5. PROCESAMIENTO SEGÚN ESTADO
   └─→ Menú Principal:
       - Opción "1" → Muestra todo el stock
       - Opción "2" → Muestra horarios y servicios
       - Opción "0" → Vuelve al menú principal
   
   └─→ Estado de Conversación (se guarda en WhatsAppSession):
       - Menu_Principal
       - Consultar_Stock
       - Consultar_Asistencia

6. CONSULTA A LA BASE DE DATOS
   └─→ Stock: Consulta inventory, supply, branch
   └─→ Horarios: Consulta branch
   └─→ Asistencia: Consulta employee (no implementado en menú)

7. ENVÍO DE RESPUESTA
   └─→ EvolutionApiService.sendMessage()
   └─→ Formatea el número: 591XXX@s.whatsapp.net
   └─→ Envía a través de Evolution API

8. REGISTRO EN LOGS
   └─→ ChatbotLog: teléfono, intención, mensaje usuario, respuesta bot
```

### Menú del Chatbot

```
Hola *Señor de las Tintas*

Como te podemos ayudar?

1 - Consultar todo el stock
2 - Horarios y servicios
0 - Menu principal

Responde con el numero de tu opcion
```

#### Opción 1: Consultar Stock

Muestra todos los productos en inventario agrupados por nombre:

```
📦 *Stock de Productos*

*Cabezal Impresora*
  - Sucursal Centro: 5 unidades
  - Sucursal Norte: 5 unidades
  - Sucursal Sur: 5 unidades

*Tinta Amarilla*
  - Sucursal Centro: 40 unidades
  - Sucursal Norte: 40 unidades
  - Sucursal Sur: 40 unidades

*Tinta Cyan*
  - Sucursal Sur: 30 unidades
  - Sucursal Centro: 30 unidades
  - Sucursal Norte: 30 unidades

... (más productos)

Escribe 0 para volver al menu
```

#### Opción 2: Horarios y Servicios

Muestra las sucursales con sus horarios y servicios disponibles:

```
Horarios de atención:

Sucursal Centro - Lun-Sáb: 9:00-20:00, Dom: 10:00-18:00
Dirección: Av. Principal #123, Centro
Link: https://maps.google.com/?q=19.4326,-99.1332

Sucursal Norte - Lun-Sáb: 8:00-21:00, Dom: 9:00-19:00
Dirección: Blvd. Norte #456, Colonia Industrial
Link: https://maps.google.com/?q=19.4500,-99.1500

Sucursal Sur - Lun-Sáb: 9:00-20:00
Dirección: Calle Sur #789, Col. Sur
Link: https://maps.google.com/?q=19.4000,-99.1200


Servicios disponibles:
- Recarga de cartuchos
- Venta de tintas originales y compatibles
- Mantenimiento de impresoras
- Impresiones color y B/N

Escribe 0 para volver al menu
```

### Detección de Intenciones

El chatbot detecta intenciones basándose en palabras clave del mensaje:

| Intención | Palabras Clave | Acción |
|-----------|----------------|--------|
| `Consultar_Stock` | stock, tinta, canon, epson, hp, producto | Muestra stock |
| `Consultar_Horario` | horario, atención, ubicacion, services | Muestra horarios |
| `Consultar_Asistencia` | asistencia, empleado, entrada, salida | Solicita nombre |
| `Menu_Principal` | 0 | Regresa al menú |
| `Unknown` | Cualquier otro texto | Muestra el menú |

### Estados del Flujo de Conversación

El chatbot mantiene un estado por cada número de teléfono (WhatsAppSession):

| Estado | Descripción |
|--------|-------------|
| `MenuPrincipal` | Esperando selección de opción |
| `ConsultarStock` | Usuario consultando inventario |
| `ConsultarAsistencia` | Usuario consultando asistencia |
| `Horarios` | Usuario viendo horarios |

### Acceso Público

El chatbot funciona para **cualquier número** que envíe mensajes al WhatsApp de la instancia. **No requiere registro previo** - cualquier persona puede consultar stock y horarios.

### Pruebas del Chatbot

#### Enviar mensaje de prueba desde API

```bash
curl -X POST "http://localhost:3000/api/chatbot/test" \
  -H "Content-Type: application/json" \
  -d '{"phone": "59167645041", "message": "Hola"}'
```

#### Ver logs del chatbot

```bash
# Últimos 10 logs
curl "http://localhost:3000/api/chatbot/logs?limit=10"

# Filtrar por número
curl "http://localhost:3000/api/chatbot/logs?phone_number=59167645041"

# Filtrar por intención
curl "http://localhost:3000/api/chatbot/logs?detected_intention=Menu_Principal"
```

### Configurar WhatsApp

#### Crear nueva instancia

```bash
# Crear instancia con QR
curl -X POST "http://localhost:8080/instance/create" \
  -H "apikey: fixed-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "senorbot",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

#### Ver estado de instancia

```bash
curl "http://localhost:8080/instance/fetchInstances" \
  -H "apikey: fixed-api-key-12345"
```

#### Acceder al panel de Evolution API

- **URL**: http://localhost:8080/manager
- **API Key Global**: fixed-api-key-12345
- **Instancia**: senorbot (estado debe ser "open")

### Solución de Problemas

#### El chatbot no responde mensajes

1. **Verificar que la instancia esté conectada:**
   ```bash
   curl "http://localhost:8080/instance/fetchInstances" -H "apikey: fixed-api-key-12345"
   # El estado debe ser: "open"
   ```

2. **Verificar logs del backend:**
   ```bash
   docker logs backend_nestjs 2>&1 | grep "Procesando mensaje"
   ```

3. **Verificar logs de Evolution API:**
   ```bash
   docker logs evolution_api 2>&1 | grep "messages.upsert"
   ```

#### La instancia se desconectó (error 401)

1. El WhatsApp puede desconectarse por inactividad o cambios en la sesión
2. Necesitas crear una nueva instancia y escanear el QR nuevamente:
   - Ve a: http://localhost:8080/manager
   - API Key: fixed-api-key-12345
   - Busca la instancia o crea una nueva
   - Escanea el nuevo QR con tu WhatsApp

#### Mensajes appear como "fromMe: true"

Esto ocurre cuando el número de WhatsApp del usuario es igual al número de la instancia. El chatbot está configurado para procesar estos mensajes igualmente.

---

## 🎭 Sistema de Roles

El sistema tiene 3 tipos de usuarios con diferentes niveles de acceso:

### Roles Disponibles

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **ADMIN** | Administrador del sistema | Total (todas las sucursales) |
| **SECRETARIA** | Encargada de sucursal | Solo su sucursal asignada |
| **EMPLOYEE** | Empleado (solo asistencia) | Solo check-in/check-out con PIN |

### Permisos por Rol

| Módulo | ADMIN | SECRETARIA | EMPLOYEE |
|--------|-------|------------|----------|
| **Auth** | ✅ Login/Register/Logout | ✅ Login/Logout/Profile | ❌ |
| **Branch** | ✅ CRUD | ✅ Ver la suya | ❌ |
| **Supply** | ✅ CRUD | ✅ Ver catálogo | ❌ |
| **Inventory** | ✅ CRUD | ✅ Su sucursal | ❌ |
| **Employee** | ✅ CRUD | ✅ Su sucursal | ❌ |
| **Attendance** | ✅ Todo | ✅ Su sucursal | ✅ Check-in/out |
| **StockTransfer** | ✅ Todo | ✅ Crear/Ver | ❌ |
| **Uploads** | ✅ Subir archivos | ✅ Subir archivos | ❌ |

### Cómo funciona SECRETARIA

Las secretarias tienen una **sucursal asignada** (branch_id) en su perfil. JWT incluye este campo:

```json
{
  "sub": "uuid-usuario",
  "id": "uuid-usuario",
  "email": "secretaria@email.com",
  "role": "secretaria",
  "type": "access",
  "branch_id": "uuid-sucursal-centro"
}
```

**Restricciones:**
- Solo ven/gestionan datos de SU sucursal
- Los filtros por `branch_id` son ignorados (siempre usan el suyo)
- No pueden eliminar registros
- En transferencias: su sucursal debe estar involucrada (origen O destino)

### Cómo crear una SECRETARIA

Solo el ADMIN puede crear secretarias:

```bash
POST /api/auth/register-secretaria
Authorization: Bearer <admin_token>

{
  "email": "secretaria@email.com",
  "password": "password123",
  "full_name": "Nombre Secretaria",
  "branch_id": "uuid-sucursal-asignada"
}
```

---

## 🔄 Transferencia de 1 Paso (Transacción Atómica)

### Descripción

El sistema ofrece dos métodos para traspasar stock entre sucursales:

### Método 1: Transferencia de 1 Paso (RECOMENDADO)

```
POST /api/inventory/transfer
```

**Características:**
- 1 solo llamado API
- Transacción atómica (BEGIN → COMMIT o ROLLBACK)
- Si falla cualquier paso, TODO se revierte
- Validaciones previas
- Historial automático en stock_transfer

**Body:**
```json
{
  "origin_branch_id": "uuid-origen",
  "destination_branch_id": "uuid-destino",
  "supply_id": "uuid-insumo",
  "quantity": 50
}
```

**Flujo interno:**
1. Validar existencia de sucursales e insumo
2. Validar stock suficiente en origen
3. BEGIN TRANSACTION
4. Débito origen (-quantity)
5. Crédito destino (+quantity o crear si no existe)
6. Insertar en stock_transfer (historial)
7. COMMIT (si todo OK) o ROLLBACK (si falla)

**Para SECRETARIAS:**
- Solo puede transferir si su sucursal está involucrada
- Origen = su sucursal ✅
- Destino = su sucursal ✅
- Ninguna = su sucursal ❌

### Método 2: Transferencia de 2 Pasos (Existente)

```
POST /api/stock-transfer        → Crear solicitud (status: in_transit)
POST /api/stock-transfer/:id/receive  → Aprobar (débito + crédito)
```

**Diferencias:**

| Aspecto | 1 Paso (Nuevo) | 2 Pasos (Existente) |
|---------|-----------------|----------------------|
| Pasos | 1 | 2 |
| Stock origen | Se resta inmediatamente | Se resta al aprobar |
| Estado | "received" directo | "in_transit" → "received" |
| Rollback | Automático si falla | Solo si no se aprueba |
| para SECRETARIAS | ✅ Sí | ❌ No |

---

## 📱 Guía para el Frontend

### Autenticación JWT

El sistema utiliza JWT (JSON Web Tokens) para la autenticación:

1. **Login:** Obtener tokens mediante `/auth/login` o `/auth/login-pin`
2. **Enviar token:** Incluir en headers `Authorization: Bearer <token>`
3. **Renovar:** Usar `/auth/refresh` cuando expire el access_token
4. **Logout:** Llamar `/auth/logout` para revocar el refresh_token

### Endpoints Públicos (Sin Auth)

- `/auth/register`
- `/auth/login`
- `/auth/login-pin`
- `/auth/refresh`
- `/attendance/check-in`
- `/attendance/check-out`
- `/chatbot/webhook` (todos los webhooks)
- `/chatbot/logs`
- `/seed/*`
- `/uploads/images/supplies/*` (ver imágenes)
- `/uploads/videos/supplies/*` (ver videos)

### Endpoints Protegidos (Requieren JWT + Rol)

| Endpoint | Roles Permitidos |
|----------|-----------------|
| `/auth/logout` | Any authenticated |
| `/auth/profile` | Any authenticated |
| `/auth/register-secretaria` | ADMIN |
| `/branch/*` | ADMIN, SECRETARIA |
| `/employee/*` | ADMIN, SECRETARIA |
| `/supply/*` | ADMIN, SECRETARIA |
| `/inventory/*` | ADMIN, SECRETARIA |
| `/inventory/transfer` | ADMIN, SECRETARIA |
| `/stock-transfer/*` | ADMIN, SECRETARIA |
| `/attendance/*` (excepto check-in/out) | ADMIN, SECRETARIA |
| `/uploads/images` | ADMIN, SECRETARIA |
| `/uploads/videos` | ADMIN, SECRETARIA |
| `/chatbot/test` | ADMIN |

**Nota:** Aunque la tabla anterior muestra `ADMIN, SECRETARIA` para la mayoría de módulos, las operaciones **DELETE** y algunos endpoints específicos requieren exclusivamente `ADMIN`:
- `DELETE /api/branch/:id`
- `DELETE /api/employee/:id`
- `DELETE /api/supply/:id`
- `DELETE /api/inventory/:id`
- `DELETE /api/stock-transfer/:id`
- `DELETE /api/attendance/:id`
- `POST /api/auth/register-secretaria`
- `POST /api/chatbot/test`

### Manejo de Errores

Todas las respuestas siguen un formato estandarizado:

**Éxito:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

### Tabla de Errores HTTP

| Código | Significado | Cuándo ocurre | Qué hacer |
|--------|-------------|---------------|-----------|
| 400 | Bad Request | Datos inválidos o faltantes | Verificar el body de la petición |
| 401 | Unauthorized | Token expirado o inválido | Renovar token con `/auth/refresh` |
| 403 | Forbidden | Rol insuficiente | Verificar permisos del usuario |
| 404 | Not Found | Recurso no existe | Verificar el ID enviado |
| 409 | Conflict | Recurso duplicado | Verificar si ya existe |
| 429 | Too Many Requests | Rate limit superado | Esperar y reintentar |

### Manejo de Token Expirado (401)

Cuando el backend responde con 401, el frontend debe intentar renovar el token:

```javascript
async function fetchWithRefresh(url, options = {}) {
  let response = await fetch(url, options);
  
  if (response.status === 401) {
    // Intentar renovar token
    const refreshToken = localStorage.getItem('refresh_token');
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (refreshResponse.ok) {
      const { data } = await refreshResponse.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      // Reintentar con nuevo token
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${data.access_token}`,
      };
      response = await fetch(url, options);
    } else {
      // Refresh falló - redirigir a login
      localStorage.clear();
      window.location.href = '/login';
    }
  }
  
  return response;
}
```

### Manejo de Rate Limit (429)

Cuando el backend responde con 429, el frontend debe esperar antes de reintentar:

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      // Esperar antes de reintentar (backoff exponencial)
      const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Rate limit superado después de múltiples intentos');
}
```

### Paginación

Todos los endpoints GET con lista usan paginación:

```typescript
// Parámetros query
{
  limit: number,   // default: 10
  offset: number   // default: 0
}

// Respuesta
{
  "success": true,
  "data": [
    { "id": "uuid-1", "name": "Sucursal Centro", ... },
    { "id": "uuid-2", "name": "Sucursal Norte", ... }
  ],
  "meta": {
    "total": 50,
    "limit": 10,
    "offset": 0
  }
}
```

**Ejemplo real de paginación en JavaScript:**
```javascript
async function getBranches(page = 0, pageSize = 10) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(
    `/api/branch?limit=${pageSize}&offset=${page * pageSize}`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  
  const { data, meta } = await response.json();
  
  return {
    branches: data,
    totalPages: Math.ceil(meta.total / meta.limit),
    currentPage: Math.floor(meta.offset / meta.limit) + 1,
    totalItems: meta.total,
  };
}

// Uso:
const { branches, totalPages, currentPage } = await getBranches(0, 10);
console.log(`Página ${currentPage} de ${totalPages}`);
console.log(branches); // Array de sucursales
```

### Filtros Comunes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `limit` | number | Límite de resultados |
| `offset` | number | Skip de resultados |
| `name` | string | Filtro por nombre (LIKE) |
| `active` | boolean | Filtro por estado |

---

## 🔧 seed (Datos de Prueba)

### Credenciales de Prueba

**Admin:**
- Email: `admin@senordelastintas.com`
- Password: `admin123`

**Empleados:**
| PIN | Nombre | Cargo |
|-----|--------|-------|
| 1234 | Juan Pérez | Vendedor |
| 5678 | María González | Cajera |
| 9012 | Carlos López | Técnico |
| 3456 | Ana Martínez | Vendedor |
| 7890 | Pedro Sánchez | Encargado |

### Datos que Inserta el Seed

| Tabla | Cantidad |
|-------|----------|
| `user` | 1 admin |
| `branch` | 3 sucursales |
| `supply` | 10 insumos |
| `employee` | 5 empleados |
| `inventory` | 30 registros |
| `stock_transfer` | 2 traspasos |
| `attendance` | 15 registros |

### Cómo Usar

```bash
# 1. Verificar estado
GET /api/seed/status

# 2. Ejecutar seed
POST /api/seed/all

# 3. Hacer login
POST /api/auth/login
Body: { "email": "admin@senordelastintas.com", "password": "admin123" }
```

---

## 🧪 Pruebas del Frontend contra la API

### Entorno Local (Sin Docker)

El frontend se conecta directamente al backend en `http://localhost:3000`.

**Requisitos:**
- PostgreSQL corriendo en `localhost:5432`
- Node.js 20+
- Backend iniciado con `npm run start:dev`

**Configuración del Frontend:**
```dart
// Configuración base de la API
const String apiBaseUrl = 'http://localhost:3000/api';

// Opcional: si el frontend corre en otro puerto, configurar CORS en el backend
// .env del backend:
CORS_ORIGIN=http://localhost:3001,http://localhost:5173,http://tu-frontend.local
```

**Ejemplo de login desde Flutter:**
```dart
Future<Map<String, dynamic>> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('$apiBaseUrl/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'email': email, 'password': password}),
  );

  if (response.statusCode == 201) {
    return jsonDecode(response.body)['data'];
  }
  throw Exception('Error al iniciar sesión');
}
```

**Probar con curl (local):**
```bash
# Seed
curl -X POST http://localhost:3000/api/seed/all

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@senordelastintas.com","password":"admin123"}'
```

### Entorno Docker

El frontend se conecta al backend expuesto en `http://localhost:3000` (mapeado por Docker).

**Requisitos:**
- Docker y Docker Compose instalados
- Contenedores levantados con `docker compose up -d --build`

**Configuración del Frontend:**
```dart
// Misma URL que local (el puerto 3000 se mapea al contenedor)
const String apiBaseUrl = 'http://localhost:3000/api';
```

**Probar con curl (Docker):**
```bash
# 1. Verificar que el backend esté saludable
curl http://localhost:3000/api/seed/status

# 2. Ejecutar seed dentro del contenedor
docker compose exec backend curl -X POST http://localhost:3000/api/seed/all

# 3. O desde fuera del contenedor
curl -X POST http://localhost:3000/api/seed/all

# 4. Login de admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@senordelastintas.com","password":"admin123"}'
```

**Si el frontend corre dentro de Docker (otro contenedor):**
```yaml
# docker compose.yml del frontend
services:
  frontend:
    # ...
    environment:
      API_URL: http://backend:3000/api  # Nombre del servicio backend
```

### Flujo Completo de Pruebas

```bash
# ────── 1. LOCAL ──────

# Terminal 1: Iniciar backend
cd backend && npm run start:dev

# Terminal 2: Probar endpoints
curl http://localhost:3000/api/seed/status
curl -X POST http://localhost:3000/api/seed/all
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@senordelastintas.com","password":"admin123"}'

# ────── 2. DOCKER ──────

# Construir e iniciar
docker compose up -d --build

# Ejecutar migraciones
docker compose exec backend npm run migration:run

# Sembrar datos
curl -X POST http://localhost:3000/api/seed/all

# Login de prueba
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@senordelastintas.com","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])")

# Probar endpoint protegido
curl http://localhost:3000/api/branch \
  -H "Authorization: Bearer $TOKEN"

# Probar subida de imagen
curl -X POST http://localhost:3000/api/uploads/images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/ruta/a/imagen.jpg"
```

### Errores Comunes en Pruebas

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `ECONNREFUSED :3000` | Backend no está corriendo | Verificar `docker compose ps` o `npm run start:dev` |
| `401 Unauthorized` | Token ausente o expirado | Hacer login de nuevo o renovar token |
| `403 Forbidden` | Rol insuficiente | Verificar que el usuario tenga el rol necesario |
| `429 Too Many Requests` | Rate limit superado | Esperar 1 segundo y reintentar |
| `Cannot find module` | Migraciones no ejecutadas | Ejecutar `migration:run` |
| Imagen/video no se ve en frontend | CORS mal configurado | Agregar origen del frontend a `CORS_ORIGIN` |

---

## 🐳 Docker

### Servicios

| Servicio | Contenedor | Puerto | Base de Datos |
|----------|------------|--------|----------------|
| **Backend** | `backend_nestjs` | 3000 | - |
| **Backend DB** | `backend_postgres` | 5432 | `backend` |
| **Evolution API** | `evolution_api` | 8080 | - |
| **Evolution DB** | `evolution_postgres` | 5432 | `evolution` |

### Variables de Entorno (.env)

```env
# PostgreSQL
DB_PASSWORD=tu_password

# Evolution API
EVOLUTION_API_KEY=tu_api_key
INSTANCE_NAME=Señor_de_las_Tintas

# Backend NestJS
PORT=3000
DB_HOST=backend-db
DB_PORT=5432
DB_NAME=backend
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_SYNC=true

# Chatbot
EVOLUTION_URL=http://evolution:8080
INSTANCE_API_KEY=tu_instance_api_key
WEBHOOK_SECRET=webhook-shared-secret (debe coincidir con el configurado en Evolution API)

# Auditoría
SYSTEM_AUDIT_USER_ID=00000000-0000-4000-8000-000000000001

# JWT Auth
JWT_SECRET=super-secret-key-jwt-senior-de-las-tintas-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_DAYS=7

# CORS
CORS_ORIGIN=http://localhost:3001

# NestJS
NODE_ENV=development
PORT=3000
```

### Comandos Docker

```bash
# Iniciar todos los servicios
docker compose up --build

# Ver logs del backend
docker compose logs -f backend

# Detener servicios
docker compose down

# Ver estado
docker compose ps
```

### ⚙️ Configuración DB_SYNC

| Valor | Cuándo usar | Comportamiento |
|-------|-------------|----------------|
| `DB_SYNC=true` | **Desarrollo** | Las tablas se crean automáticamente desde las entidades |
| `DB_SYNC=false` | **Producción** | Las tablas NO se crean automáticamente. Requiere ejecutar `migration:run` |

**En Docker (producción):**
```yaml
# docker compose.yml
environment:
  - DB_SYNC=${DB_SYNC:-false}  # Por defecto false
```

**Para desarrollo con Docker:**
```bash
DB_SYNC=true docker compose up -d
```

---

### 📦 Dockerfile Actualizado

El proyecto incluye un Dockerfile optimizado que copia los archivos necesarios para ejecutar migraciones:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY node_modules/ ./node_modules/
COPY src/data-source.ts ./src/data-source.ts    # ← Necesario para migraciones
COPY src/migrations/ ./src/migrations/          # ← Necesario para migraciones
COPY .env ./                                    # ← Variables de entorno
COPY uploads/ ./uploads/                        # ← Archivos subidos

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

**Por qué se necesitan estos archivos:**
- `src/data-source.ts` - Configuración de TypeORM para CLI
- `src/migrations/` - Scripts de migración de la base de datos
- `.env` - Variables de entorno (contraseñas, keys)
- `uploads/` - Imágenes y videos subidos por usuarios

---

### 🔍 Solución de Problemas

#### Error: "Cannot find module '/app/src/data-source.ts'"

**Causa:** El Dockerfile no copia los archivos necesarios para migraciones.

**Solución:** Verificar que el Dockerfile incluya:
```dockerfile
COPY src/data-source.ts ./src/data-source.ts
COPY src/migrations/ ./src/migrations/
```

#### La base de datos está vacía (sin tablas)

**Causa:** Se levantó el container sin ejecutar migraciones (`DB_SYNC=false`).

**Solución:**
```bash
docker compose exec backend npm run migration:run
```

#### Error de conexión a Evolution API (EAI_AGAIN)

**Causa:** El backend intenta conectar a `evolution:8080` pero el servicio no está disponible.

**Solución:**
1. Verificar que Evolution API esté corriendo:
   ```bash
   docker compose ps
   ```
2. Ver logs:
   ```bash
   docker compose logs evolution
   ```

#### La instancia de WhatsApp está desconectada

**Causa:** La instancia "senorbot" existe pero no está conectada a WhatsApp.

**Solución:**
1. Acceder al panel de Evolution API: http://localhost:8080/manager
2. API Key: `fixed-api-key-12345`
3. Buscar la instancia "senorbot"
4. Escanear el código QR con WhatsApp

#### Verificar estado de Evolution API

```bash
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: fixed-api-key-12345"
```

---

## 🗄️ Migraciones de Base de Datos

El proyecto usa **TypeORM Migrations** para el esquema de BD en producción (`DB_SYNC=false`).
En desarrollo local, `DB_SYNC=true` crea las tablas automáticamente desde las entidades.

### Comandos Útiles

```bash
# Ejecutar migraciones pendientes (local)
npm run migration:run

# Ejecutar migraciones (Docker)
docker compose exec backend npm run migration:run

# Generar una nueva migración desde cambios en entidades
npm run migration:generate -- src/migrations/<nombre-descriptivo>
```

| Variable | `true` | `false` |
|----------|--------|---------|
| `DB_SYNC` | Desarrollo (automático) | Producción (requiere `migration:run`) |

---

### Comandos de Migración

Todos los comandos se ejecutan desde la raíz del proyecto:

#### 1. Generar una nueva migración

```bash
npm run migration:generate -- src/migrations/<nombre>
```

**Ejemplos:**
```bash
# Crear migración para agregar campo
npm run migration:generate -- src/migrations/agregar-campo-producto

# Crear migración para nueva tabla
npm run migration:generate -- src/migrations/crear-tabla-proveedores

# Crear migración para modificar relación
npm run migration:generate -- src/migrations/modificar-relacion-inventory
```

**Resultado:**
- Se genera un archivo en `src/migrations/` con formato: `1779298031234-nombre.ts`
- TypeORM detecta cambios entre entidades y DB actual

## 🔄 Flujos de Negocio

### 1. Registro de Asistencia (Empleado)

```
1. Empleado ingresa PIN en PWA
   → POST /auth/login-pin (opcional para obtener token)
   → POST /attendance/check-in (primero)
   → POST /attendance/check-out (si check-in responde "ya registró entrada")

2. Sistema valida empleado + PIN
3. Intenta check-in primero
4. Si el backend responde "Ya existe registro de entrada para este empleado en la fecha de hoy" → ejecuta check-out
5. Sistema calcula horas trabajadas
```

### 2. Traspaso de Mercadería

```
1. Admin crea traspaso (origen → destino)
   → POST /stock-transfer (con JWT)

2. Sistema valida stock en origen
3. Estado: "in_transit"

4. Receptor confirma → POST /stock-transfer/:id/receive
   → Se descuenta de origen
   → Se suma en destino
   → Estado: "received"

5. O receptor rechaza → POST /stock-transfer/:id/reject
   → Estado: "rejected"
```

### 3. Chatbot WhatsApp

```
1. Cliente envía mensaje a WhatsApp
2. Evolution API reenvía al webhook → POST /chatbot/webhook
3. Chatbot procesa y detecta intención
4. Responde consultando datos del backend
5. Registra interacción en chatbot_log
```

---

## ✅ Estados Enum

### StockTransfer Status
| Estado | Descripción |
|--------|-------------|
| `in_transit` | En tránsito |
| `received` | Recibido |
| `rejected` | Rechazado |

### Attendance Entry Status
| Estado | Descripción |
|--------|-------------|
| `punctual` | Puntual (≤ 9:00) |
| `late` | Tarde (> 9:00) |
| `absence` | Falta |

### Chatbot Intention
| Intención | Descripción |
|-----------|-------------|
| `Consultar_Stock` | Consulta de inventario |
| `Consultar_Horario` | Consulta de horarios |
| `Consultar_Asistencia` | Consulta de asistencia |
| `Menu_Principal` | Seleccionó opción del menú |
| `Unknown` | No se detectó intención |

### WhatsApp Flow State
| Estado | Descripción |
|--------|-------------|
| `Menu_Principal` | En menú principal |
| `Consultar_Stock` | En flujo de stock |
| `Consultar_Asistencia` | En flujo de asistencia |
| `Horarios` | En flujo de horarios |
| `Esperando_Opcion` | Esperando selección |

---

## 📅 Funcionalidades Completadas

- [x] Módulo de autenticación (JWT) ✅
- [x] Roles y permisos (Admin, Secretaria, Empleado) ✅
- [x] Sistema de auditoría (created_by, updated_by, deleted_by con userId directo) ✅
- [x] Soft delete atómico (update en lugar de softDelete + save) ✅
- [x] Seguridad en subidas (magic bytes, mimetype map, path traversal) ✅
- [x] Idempotencia en transferencias (SHA256 automático) ✅
- [x] Rate limiting (3 tiers) y Helmet (CSP, HSTS) ✅
- [x] Seed de datos de prueba ✅
- [x] Catálogo de insumos con `is_active` (ocultar sin borrar) ✅
- [x] Umbral mínimo crítico (`umbral_min`) global por insumo + alertas `GET /inventory/alerts` ✅
- [x] Dashboard de alertas de stock crítico (frontend) ✅
- [x] Recarga automática de inventario al cambiar sucursal ✅
- [x] Recarga automática de empleados, dashboard y reportes al cambiar sucursal ✅
- [x] `<datalist>` dinámico para categorías, unidades de medida y cargos ✅
- [x] Check-in/out secuencial (intenta check-in, si ya existe → check-out) ✅
- [x] Actualización de PIN de 4 a 4-6 dígitos (consistente con backend) ✅
- [x] PINs hasheados con bcrypt (store + compare en attendance y auth) 🔒
- [x] Sin fallbacks hardcodeados de secrets (JWT_SECRET, EVOLUTION_API_KEY obligatorios) 🔒
- [x] `.env` untracked de git (usar `.env.example`) 🔒
- [x] Seed protegido con rol ADMIN (antes `@AllowAnonymous()`) 🔒
- [x] WebhookAuthGuard con `x-webhook-secret` en endpoints webhook 🔒
- [x] Rate limiting específico: login-pin (5/min), check-in/out (10/min) 🔒
- [x] Mapeo explícito de campos en services (sin `Object.assign`) 🔒

---

## 📞 Contacto y Soporte

Para dudas técnicas sobre la API:
- Consultar Swagger: `http://localhost:3000/docs`
- Revisar logs: `docker compose logs -f backend`

---

*Documentación generada para consumo del frontend - El Señor de las Tintas*