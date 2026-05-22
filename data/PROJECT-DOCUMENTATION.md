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

2. Backend:
   - Busca empleado por PIN activo
   - Genera access_token con employee_id

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

**Access Token (15 minutos):**
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

**Refresh Token (7 días):**
```json
{
  "sub": "uuid-del-usuario",
  "id": "uuid-del-usuario",
  "email": "admin@email.com",
  "role": "admin",
  "type": "refresh"
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
| **Supply** | `supply` | `supply` | Catálogo de insumos |
| **Inventory** | `inventory` | `inventory` | Stock por sucursal |
| **StockTransfer** | `stock_transfer` | `stock-transfer` | Traspasos de mercadería |
| **Attendance** | `attendance` | `attendance` | Registro de asistencia |

### Entidades del Chatbot

| Entidad | Tabla DB | Módulo | Descripción |
|---------|-----------|--------|-------------|
| **WhatsAppSession** | `whatsapp_session` | `chatbot` | Sesiones activas de WhatsApp |
| **ChatbotLog** | `chatbot_log` | `chatbot` | Auditoría de interacciones |

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

| Nivel | Límite | Ventana |
|-------|--------|---------|
| `short` | 10 req | 1 segundo |
| `medium` | 50 req | 10 segundos |
| `long` | 100 req | 1 minuto |

Si superas el límite, recibirás error `429 Too Many Requests`.

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

> ⚠️ **IMPORTANTE**: Todos los endpoints tienen el prefiio `/api`
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
| POST | `/api/auth/register` | Registrar primer admin | ❌ Público |
| POST | `/api/auth/login` | Login admin (email + password) | ❌ Público |
| POST | `/api/auth/login-pin` | Login empleado (solo PIN) | ❌ Público |
| POST | `/api/auth/refresh` | Renovar access token | ❌ Público |
| POST | `/api/auth/logout` | Cerrar sesión | ✅ JWT |
| POST | `/api/auth/register-secretaria` | Crear secretaria (solo admin) | ✅ JWT |
| GET | `/api/auth/profile` | Perfil del usuario actual | ✅ JWT |
| GET | `/api/auth/secretarias` | Listar todas las secretarias (solo admin) | ✅ JWT |

**Registro del primer admin (SOLO UNA VEZ):**
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
| POST | `/api/seed/all` | Ejecutar seed (inserta datos) | ❌ Público |
| POST | `/api/seed/reset` | Limpiar datos y reinstallar | ❌ Público |

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
  "unit_of_measure": "unidades"
}
```

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
| GET | `/api/inventory/:id` | Obtener por ID | ✅ Admin/Secretaria |
| PATCH | `/api/inventory/:id` | Actualizar inventario | ✅ Admin/Secretaria |
| PATCH | `/api/inventory/:id/adjust` | Ajustar cantidad (±) | ✅ Admin/Secretaria |
| POST | `/api/inventory/transfer` | **TRASPASO 1 PAGO (ATÓMICO)** | ✅ Admin/Secretaria |
| DELETE | `/api/inventory/:id` | Eliminar (soft delete) | ✅ Admin |

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
curl -X POST "http://localhost:3000/chatbot/test" \
  -H "Content-Type: application/json" \
  -d '{"phone": "59167645041", "message": "Hola"}'
```

#### Ver logs del chatbot

```bash
# Últimos 10 logs
curl "http://localhost:3000/chatbot/logs?limit=10"

# Filtrar por número
curl "http://localhost:3000/chatbot/logs?phone_number=59167645041"

# Filtrar por intención
curl "http://localhost:3000/chatbot/logs?detected_intention=Menu_Principal"
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
| **Auth** | ✅ Login/Register/Logout | ✅ Login/Logout | ❌ |
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
  "email": "secretaria@email.com",
  "role": "secretaria",
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
| `/auth/logout` | ADMIN |
| `/auth/profile` | ADMIN, SECRETARIA |
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

### Endpoints Protegidos (Requieren JWT + Rol Admin)

Todos los endpoints de:
- `/branch/*`
- `/employee/*`
- `/supply/*`
- `/inventory/*`
- `/stock-transfer/*`
- `/attendance/*` (excepto check-in/check-out)
- `/auth/logout`
- `/auth/profile`

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

# Auditoría
SYSTEM_AUDIT_USER_ID=00000000-0000-4000-8000-000000000001

# JWT Auth
JWT_SECRET=super-secret-key-jwt-senior-de-las-tintas-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_DAYS=7
```

### Comandos Docker

```bash
# Iniciar todos los servicios
docker-compose up --build

# Ver logs del backend
docker-compose logs -f backend

# Detener servicios
docker-compose down

# Ver estado
docker-compose ps
```

---

### 🔧 Despliegue Completo (Desde Cero)

Este es el flujo completo para levantar la aplicación desde cero en producción:

#### 1. Limpiar contenedores y volúmenes anteriores

```bash
docker compose down -v
```

#### 2. Construir e iniciar servicios

```bash
docker compose up -d --build
```

Este comando:
- Construye la imagen del backend
- Crea las redes y volúmenes
- Inicia todos los contenedores
- Espera a que las bases de datos estén saludables

#### 3. Ejecutar migraciones

```bash
docker compose exec backend npm run migration:run
```

**Importante:** La base de datos se crea vacía (solo estructura). Las migraciones crean las tablas.

#### 4. (Opcional) Insertar datos de prueba

```bash
curl -X POST http://localhost:3000/api/seed/all
```

Esto inserta:
- 1 admin
- 3 sucursales
- 10 insumos
- 5 empleados
- 30 registros de inventario

#### 5. Verificar que todo funcione

```bash
# Estado del sistema
curl http://localhost:3000/api/seed/status

# Login de admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@senordelastintas.com","password":"admin123"}'
```

---

### ⚙️ Configuración DB_SYNC

| Valor | Cuándo usar | Comportamiento |
|-------|-------------|----------------|
| `DB_SYNC=true` | **Desarrollo** | Las tablas se crean automáticamente desde las entidades |
| `DB_SYNC=false` | **Producción** | Las tablas NO se crean automáticamente. Requiere ejecutar `migration:run` |

**En Docker (producción):**
```yaml
# docker-compose.yml
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

### Descripción General

El proyecto utiliza **TypeORM Migrations** para gestionar el esquema de la base de datos en lugar de `synchronize`. Esto proporciona:

- ✅ Control/versionado del esquema de DB
- ✅ Despliegues seguros en producción
- ✅ Rollback de cambios si es necesario
- ✅ Historial de cambios en el código

### Configuración

#### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/data-source.ts` | Configuración para CLI de TypeORM |
| `src/migrations/` | Directorio donde se guardan las migraciones |
| `.env` | Variable `DB_SYNC` para controlar sincronización |

#### data-source.ts

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'backend',
  synchronize: false,          // ⚠️ Siempre false (usa migraciones)
  migrationsRun: false,        // ⚠️ Siempre false (manual)
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
```

#### Variables de Entorno

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DB_SYNC` | `true` | Desarrollo (sincronización automática) |
| `DB_SYNC` | `false` | Producción (requiere migraciones) |

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

#### 2. Ejecutar todas las migraciones pendientes

```bash
npm run migration:run
```

**Efecto:**
- Ejecuta TODAS las migraciones que NO se han aplicado aún
- Crea la tabla `migrations` para tracking

#### 3. Revertir la última migración

```bash
npm run migration:revert
```

**Efecto:**
- Deshace solo la última migración aplicada
- Útil para correcciones rápidas en desarrollo

#### 4. Ver estado de migraciones

```bash
npm run migration:show
```

**Muestra:**
- Lista de migraciones aplicadas
- Migraciones pendientes

---

### Desarrollo Local (Sin Docker)

#### Flujo Completo

```bash
# 1. Configurar .env para desarrollo
DB_SYNC=true           # Sincroniza automáticamente (tablas se crean)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=TintasDB
DB_USERNAME=postgres
DB_PASSWORD=Tintas@2024Secure

# 2. Ejecutar la aplicación (sincroniza automáticamente)
npm run start:dev
```

#### Cuándo usar migraciones en desarrollo

```bash
# Cuando realizas cambios en entidades y quieres generar migración
DB_SYNC=false          # Cambiar a false para probar migraciones

# Generar migración basada en cambios
npm run migration:generate -- src/migrations/mi-cambio

# Ejecutar migración
npm run migration:run
```

---

### Producción (Docker Compose)

#### Flujo de Despliegue

```bash
# 1. Levantar servicios (crea la BD pero NO las tablas)
docker compose up -d

# 2. Verificar que el backend esté corriendo
docker compose ps

# 3. Ejecutar migraciones dentro del container
docker compose exec backend npm run migration:run
```

#### Notas Importantes

- **Docker crea la BD**: El servicio `backend-db` en docker-compose.yml crea la base de datos `backend` automáticamente
- **Las tablas NO se crean automáticamente**: Porque `DB_SYNC=false` por defecto
- **Migraciones son necesarias**: Después de levantar los containers, ejecutar `migration:run`

#### Variabe DB_SYNC en Docker

En `docker-compose.yml`:
```yaml
environment:
  - DB_SYNC=${DB_SYNC:-false}  # Por defecto false (producción)
```

Para desarrollo con Docker:
```bash
DB_SYNC=true docker compose up -d
```

---

### Ejemplo Completo: Agregar un Nuevo Campo

#### Paso 1: Modificar la entidad

```typescript
// src/modules/supply/entities/supply.entity.ts
@Entity()
export class Supply extends BaseEntity {
  // ... campos existentes ...

  @Column({ default: false })
  is_hazardous: boolean;  // ← Nuevo campo agregado
}
```

#### Paso 2: Generar la migración

```bash
npm run migration:generate -- src/migrations/agregar-campo-is-hazardous
```

#### Paso 3: Revisar la migración generada

```typescript
// src/migrations/1779298031234-agregar-campo-is-hazardous.ts
export class AgregarCampoIsHazardous1779298031234 {
  name = 'AgregarCampoIsHazardous1779298031234';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supply" ADD "is_hazardous" boolean DEFAULT false`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supply" DROP COLUMN "is_hazardous"`);
  }
}
```

#### Paso 4: Ejecutar la migración

```bash
# Desarrollo local
npm run migration:run

# Producción (Docker)
docker compose exec backend npm run migration:run
```

#### Paso 5: Verificar

```bash
# Ver estado de migraciones
npm run migration:show
```

---

### Solución de Problemas

#### "No changes in database schema were found"

**Causa:** Las tablas ya están sincronizadas (quizás con `DB_SYNC=true` antes).

**Solución:**
1. Verificar qué tablas existen:
   ```bash
   psql -U postgres -d TintasDB -c "\dt"
   ```
2. Si las tablas ya existen, no necesitas migración
3. Los cambios futuros sí generarán migraciones

#### Error de conexión a la base de datos

**Verificar:**
1. Que PostgreSQL esté corriendo
2. Que las credenciales en `.env` sean correctas
3. Que la base de datos exista

```bash
# Listar bases de datos
psql -U postgres -h localhost -l
```

#### Migración fallida en producción

1. **No panikear**: La transacción hace rollback automáticamente
2. **Revisar logs**:
   ```bash
   docker compose logs backend
   ```
3. **Corregir** el código o la migración
4. **Reintentar** después de corregir

---

### Mejores Prácticas

1. **Prefijo claro en nombres**: `agregar-campo-`, `crear-tabla-`, `modificar-relacion-`
2. **Una migración por cambio**: Mantener migraciones pequeñas y específicas
3. **Probar en desarrollo primero**: Antes de producción, всегда probar locally
4. **No editar migraciones ya aplicadas**: Si hay error, crear nueva migración
5. **Mantener backup de la BD**: Antes de migraciones importantes en producción

---

## 🔄 Flujos de Negocio

### 1. Registro de Asistencia (Empleado)

```
1. Empleado ingresa PIN en PWA
   → POST /auth/login-pin (opcional para obtener token)
   → POST /attendance/check-in o /check-out

2. Sistema valida empleado + PIN
3. Si no hay registro hoy → check-in
4. Si ya hay check-in → check-out
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
- [x] Roles y permisos (Admin, Empleado) ✅
- [x] Sistema de auditoría (created_by, updated_by, deleted_by) ✅
- [x] Seed de datos de prueba ✅

---

## 📞 Contacto y Soporte

Para dudas técnicas sobre la API:
- Consultar Swagger: `http://localhost:3000/docs`
- Revisar logs: `docker-compose logs -f backend`

---

*Documentación generada para consumo del frontend - El Señor de las Tintas*