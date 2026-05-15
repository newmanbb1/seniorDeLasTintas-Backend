# El Señor de las Tintas - Documentación del Proyecto

> Documentación técnica completa del backend, orientado para consumo frontend.

---

## 📋 Resumen del Proyecto

**El Señor de las Tintas** es un sistema integral de gestión empresarial que incluye:

- **Gestión de Sucursales**: Control multisede con inventario independiente
- **Control de Personal**: Registro de asistencia con PIN
- **Chatbot de WhatsApp**: Atención automática 24/7
- **Gestión de Inventario**: Stock por sucursal con alertas de mínimo

---

## 🛠️ Tecnologías del Proyecto

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Backend** | NestJS | 11.x |
| **ORM** | TypeORM | 0.3.x |
| **Base de Datos** | PostgreSQL | 15 |
| **Cache** | Redis | 7 |
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
│  │ Branch  │ │Employee │ │Supply   │ │Inventory│ │Attendance│  │
│  │ Module  │ │ Module  │ │ Module  │ │ Module  │ │ Module  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                │
│  ┌──────────────┐ ┌───────────────┐                          │
│  │ Stock Transfer│ │ Chatbot      │                          │
│  │ Module        │ │ Module        │                          │
│  └──────────────┘ └───────────────┘                          │
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
│  │ WhatsApp         │         │ (8 entidades) │              │
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
│   ├── dto/
│   │   └── PaginationDto.ts        → DTO de paginación
│   ├── response/                    → Respuestas estandarizadas
│   └── filters/                     → Filtros de excepciones
│
└── modules/
    ├── branch/        → Gestión de sucursales
    ├── employee/       → Gestión de empleados
    ├── supply/        → Catálogo de insumos
    ├── inventory/     → Inventario por sucursal
    ├── stock-transfer/→ Traspasos entre sucursales
    ├── attendance/    → Registro de asistencia
    └── chatbot/       → Chatbot de WhatsApp
```

---

## 🗄️ Modelo de Entidades

### Entidades del Negocio

| Entidad | Tabla DB | Módulo | Descripción |
|---------|-----------|--------|-------------|
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

> ⚠️ **Nota**: Todas las entidades del negocio heredan de `BaseEntity` e incluyen automáticamente:
> - `id` (UUID)
> - `created_at`, `created_by`
> - `updated_at`, `updated_by`
> - `deleted_at`, `deleted_by` (soft delete)

---

### 1. Branch (Sucursal)

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
- `1:N` con Inventory (una sucursal tiene muchos inventarios)
- `1:N` con Employee (una sucursal tiene muchos empleados)
- `1:N` con StockTransfer como origen
- `1:N` con StockTransfer como destino

---

### 2. Employee (Empleado)

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
  // ... campos de auditoría
}
```

**Relaciones:**
- `N:1` con Branch (pertenece a una sucursal)
- `1:N` con Attendance (muchas assistencias)

---

### 3. Supply (Insumo)

```typescript
{
  id: string;              // UUID
  name: string;            // Nombre del insumo
  category: string;         // Categoría (ej: "Tintas", "Repuestos")
  unit_of_measure: string; // Unidad (ej: "litros", "unidades")
  created_at: Date;
  // ... campos de auditoría
}
```

**Relaciones:**
- `1:N` con Inventory (un insumo puede estar en varias sucursales)
- `1:N` con StockTransfer

---

### 4. Inventory (Inventario)

```typescript
{
  id: string;              // UUID
  branch_id: string;       // FK → Branch
  supply_id: string;       // FK → Supply
  current_quantity: number;// Stock actual
  minimum_stock: number;   // Stock mínimo para alertas
  created_at: Date;
  // ... campos de auditoría
}
```

**Restricciones:**
- Unique: `(branch_id, supply_id)` - solo un registro por sucursal/insumo

---

### 5. StockTransfer (Traspaso)

```typescript
{
  id: string;              // UUID
  origin_branch_id: string;   // FK → Branch (origen)
  destination_branch_id: string; // FK → Branch (destino)
  supply_id: string;       // FK → Supply
  quantity: number;        // Cantidad a trasladar
  request_date: Date;      // Fecha de solicitud
  reception_date: Date;    // Fecha de recepción (nullable)
  status: enum;            // in_transit | received | rejected
  created_at: Date;
  // ... campos de auditoría
}
```

---

### 6. Attendance (Asistencia)

```typescript
{
  id: string;              // UUID
  employee_id: string;     // FK → Employee
  register_date: string;   // Fecha (YYYY-MM-DD)
  check_in: Date;          // Hora de entrada
  check_out: Date;         // Hora de salida (nullable)
  check_in_status: enum;  // punctual | late | absence
  hours_worked: string;    // Horas trabajadas (decimal)
  created_at: Date;
  // ... campos de auditoría
}
```

---

### 7. WhatsAppSession (Sesión WhatsApp)

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

### 8. ChatbotLog (Log del Chatbot)

```typescript
{
  id: string;              // UUID - Heredado de BaseEntity
  phone_number: string;    // Teléfono del cliente
  detected_intention: enum;// Intención detectada
  user_message: string;     // Mensaje del usuario
  bot_response: string;    // Respuesta del bot
  timestamp: Date;         // Fecha/hora del log
  created_at: Date;
  created_by: string;
  // ... campos de auditoría
}
```

---

## 🔗 Relaciones entre Entidades

```
BRANCH (1) ──────────► (N) INVENTORY
      │                        │
      │                        │
      │ (N)                    │ (N)
      ▼                        ▼
EMPLOYEE              SUPPLY (1)
      │
      │ (N)
      ▼
ATTENDENCE

BRANCH (1) ──────────► (N) STOCK_TRANSFER (origen)
      │
      │ (N)
      ▼
STOCK_TRANSFER (destino) ◄───────── (1) SUPPLY


WHATSAPP_SESSION (1) ──────────► (N) CHATBOT_LOG
```

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

### 1. Branch (Sucursales)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/branch` | Crear sucursal |
| GET | `/branch?limit=10&offset=0&name=&address=` | Listar con filtros |
| GET | `/branch/:id` | Obtener por ID |
| PATCH | `/branch/:id` | Actualizar sucursal |
| DELETE | `/branch/:id` | Eliminar (soft delete) |

**Respuesta paginada:**
```json
{
  "success": true,
  "data": [...],
  "meta": { "total": 10, "limit": 10, "offset": 0 }
}
```

---

### 2. Employee (Empleados)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/employee` | Crear empleado |
| GET | `/employee?limit=10&offset=0&full_name=&position=&branch_id=&active=` | Listar con filtros |
| GET | `/employee/:id` | Obtener por ID |
| PATCH | `/employee/:id` | Actualizar empleado |
| PATCH | `/employee/:id/toggle-active` | Activar/Desactivar |
| DELETE | `/employee/:id` | Eliminar (soft delete) |

---

### 3. Supply (Insumos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/supply` | Crear insumo |
| GET | `/supply?limit=10&offset=0&name=&category=` | Listar con filtros |
| GET | `/supply/:id` | Obtener por ID |
| PATCH | `/supply/:id` | Actualizar insumo |
| DELETE | `/supply/:id` | Eliminar (soft delete) |

---

### 4. Inventory (Inventario)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/inventory` | Crear registro de inventario |
| GET | `/inventory?limit=10&offset=0&branch_id=&supply_id=&low_stock=` | Listar con filtros |
| GET | `/inventory/:id` | Obtener por ID |
| PATCH | `/inventory/:id` | Actualizar inventario |
| PATCH | `/inventory/:id/adjust` | Ajustar cantidad (±) |
| DELETE | `/inventory/:id` | Eliminar (soft delete) |

---

### 5. StockTransfer (Traspasos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/stock-transfer` | Crear traspaso |
| GET | `/stock-transfer?limit=10&offset=0&origin_branch_id=&destination_branch_id=&status=` | Listar con filtros |
| GET | `/stock-transfer/:id` | Obtener por ID |
| PATCH | `/stock-transfer/:id` | Actualizar (solo si InTransit) |
| POST | `/stock-transfer/:id/receive` | Confirmar recepción |
| POST | `/stock-transfer/:id/reject` | Rechazar traspaso |
| DELETE | `/stock-transfer/:id` | Eliminar |

---

### 6. Attendance (Asistencia)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/attendance/check-in` | Registrar entrada |
| POST | `/attendance/check-out` | Registrar salida |
| GET | `/attendance?limit=10&offset=0&employee_id=&register_date=&check_in_status=&branch_id=` | Listar con filtros |
| GET | `/attendance/:id` | Obtener por ID |
| GET | `/attendance/report/employee/:employee_id?start_date=&end_date=` | Reporte por empleado |
| PATCH | `/attendance/:id` | Actualizar (admin) |
| DELETE | `/attendance/:id` | Eliminar (soft delete) |

**Body para check-in/check-out:**
```json
{
  "employee_id": "uuid-del-empleado",
  "pin": "1234"
}
```

---

### 7. Chatbot (WhatsApp)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/chatbot/webhook` | Webhook de Evolution API |
| GET | `/chatbot/logs?limit=10&offset=0&phone_number=&detected_intention=` | Logs de interacción |
| POST | `/chatbot/test` | Mensaje de prueba |

---

## 📱 Guía para el Frontend

### Autenticación

Actualmente el sistema no tiene autenticación JWT. Para proteger los endpoints, el frontend debe:

1. **Crear módulo de Auth** (pendiente)
2. **Enviar token en headers**: `Authorization: Bearer <token>`

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

### Paginación

Todos los endpoints GET con lista usan paginación:

```typescript
// Parámetros query
{
  limit: number,   // default: 10
  offset: number, // default: 0
}

// Respuesta
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 50,
    "limit": 10,
    "offset": 0
  }
}
```

### Filtros Comunes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `limit` | number | Límite de resultados |
| `offset` | number | Skip de resultados |
| `name` | string | Filtro por nombre (LIKE) |
| `active` | boolean | Filtro por estado |

---

## 🐳 Docker

### Servicios

| Servicio | Contenedor | Puerto | Base de Datos |
|----------|------------|--------|----------------|
| **Backend** | `backend_nestjs` | 3000 | - |
| **Backend DB** | `backend_postgres` | 5432 | `backend` |
| **Evolution API** | `evolution_api` | 8080 | - |
| **Evolution DB** | `evolution_postgres` | 5432 | `evolution` |
| **Redis** | `app_redis` | 6379 | - |

### Variables de Entorno (.env)

```env
DB_PASSWORD=tu_password
EVOLUTION_API_KEY=tu_api_key
INSTANCE_NAME=Señor_de_las_Tintas
PORT=3000
DB_HOST=backend-db
DB_PORT=5432
DB_NAME=backend
DB_USERNAME=postgres
DB_PASSWORD=tu_password
EVOLUTION_URL=http://evolution:8080
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

## 🔄 Flujos de Negocio

### 1. Registro de Asistencia (Empleado)

```
1. Empleado ingresa PIN en PWA
2. Sistema valida empleado + PIN
3. Si no hay registro hoy → check-in
4. Si ya hay check-in → check-out
5. Sistema calcula horas trabajadas
```

### 2. Traspaso de Mercadería

```
1. Admin crea traspaso (origen → destino)
2. Sistema valida stock en origen
3. Estado: "in_transit"
4. Receptor confirma → "received"
5. Se descuenta de origen, suma en destino
```

### 3. Chatbot WhatsApp

```
1. Cliente envía mensaje a WhatsApp
2. Evolution API reenvía al webhook
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

## 📅 Próximas Funcionalidades

- [ ] Módulo de autenticación (JWT)
- [ ] Roles y permisos (Admin, Empleado)
- [ ] Reportes de asistencia por período
- [ ] Alertas de stock mínimo por email
- [ ] Dashboard con métricas

---

## 📞 Contacto y Soporte

Para dudas técnicas sobre la API:
- Consultar Swagger: `http://localhost:3000/docs`
- Revisar logs: `docker-compose logs -f backend`

---

*Documentación generada para consumo del frontend - El Señor de las Tintas*