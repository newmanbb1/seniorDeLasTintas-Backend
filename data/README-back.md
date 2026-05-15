# seniorDeLasTintas-Bakend

# 📚 El Señor de las Tintas — Documentación del Sistema

> Documentación técnica del backend NestJS y modelo de base de datos.

---

## 📁 Estructura de Módulos (NestJS)

```
src/
├── common/                        → Utilidades y abstracciones globales compartidas
│   └── entities/
│       └── BaseEntity.ts          → Entidad base abstracta heredada por todas las entidades
└── modules/
    ├── attendance/        → Gestión de asistencia de empleados
    ├── branch/            → Gestión de sucursales
    ├── employee/          → Gestión de empleados
    ├── inventory/         → Control de inventario por sucursal
    ├── stock-transfer/    → Traspasos de mercadería entre sucursales
    └── supply/            → Gestión de insumos/suministros
```

> **Nota:** Los módulos de WhatsApp (`session-whatsapp`, `chatbot-log`) pueden considerarse para futuras iteraciones según el alcance del bot.

---

## 🧱 Carpeta `common` — Infraestructura Compartida

La carpeta `common` es el núcleo de reutilización del proyecto. Todo lo que sea transversal a múltiples módulos (entidades base, decoradores, guards, interceptors, pipes, DTOs genéricos, etc.) debe residir aquí.

### `common/entities/BaseEntity.ts`

Clase abstracta que **todas las entidades del sistema extienden**. Provee de forma automática los campos de auditoría y control de ciclo de vida de cada registro.

```typescript
import { Exclude } from "class-transformer";
import { Column, CreateDateColumn, DeleteDateColumn, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Exclude()
    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @Exclude()
    @Index()
    @Column('uuid')
    created_by: string;

    @Exclude()
    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @Exclude()
    @Index()
    @Column('uuid', { nullable: true })
    updated_by?: string;

    @Exclude()
    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deleted_at?: Date;

    @Exclude()
    @Index()
    @Column('uuid', { nullable: true })
    deleted_by?: string;
}
```

#### Campos de `BaseEntity`

| Campo | Tipo | Decorador TypeORM | Descripción |
|---|---|---|---|
| `id` | `string` (UUID) | `@PrimaryGeneratedColumn('uuid')` | PK única generada automáticamente como UUID |
| `created_at` | `Date` | `@CreateDateColumn` | Timestamp de creación, asignado automáticamente |
| `created_by` | `string` (UUID) | `@Column('uuid')` | ID del usuario que creó el registro |
| `updated_at` | `Date` | `@UpdateDateColumn` | Timestamp de última modificación, actualizado automáticamente |
| `updated_by` | `string` (UUID) | `@Column('uuid', nullable)` | ID del usuario que modificó el registro por última vez |
| `deleted_at` | `Date` | `@DeleteDateColumn` | Timestamp de borrado lógico (soft delete); `null` si está activo |
| `deleted_by` | `string` (UUID) | `@Column('uuid', nullable)` | ID del usuario que eliminó el registro |

#### Puntos clave

- **UUID como PK:** todas las entidades usan `string` UUID en lugar de `int` autoincremental, lo cual es más seguro y escalable para sistemas distribuidos.
- **Soft Delete habilitado:** gracias a `@DeleteDateColumn`, los registros nunca se borran físicamente. TypeORM filtra automáticamente los registros con `deleted_at IS NOT NULL` en las queries, siempre que se use `softRemove()` o `softDelete()`.
- **Auditoría completa:** los campos `created_by`, `updated_by` y `deleted_by` permiten rastrear qué usuario realizó cada acción. Deben poblarse desde el contexto de autenticación (ej. interceptor o guard que inyecta el `user.id`).
- **`@Exclude()` en todos los campos de auditoría:** usando `ClassSerializerInterceptor` de NestJS, estos campos se excluyen automáticamente de las respuestas JSON al cliente, manteniendo las APIs limpias.
- **`@Index()` en campos `_by`:** los campos de auditoría tienen índice para optimizar consultas de trazabilidad (ej. "todos los registros creados por el usuario X").

#### Uso en entidades

```typescript
import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Entity, Column } from 'typeorm';

@Entity('sucursal')
export class Sucursal extends BaseEntity {
    @Column()
    nombre: string;

    @Column()
    direccion: string;
    // ... resto de campos propios
}
```

> ⚠️ **Importante:** el campo `id` del diagrama original (tipo `int`) es reemplazado por `string UUID` gracias a `BaseEntity`. Esto aplica a **todas** las entidades del sistema.

#### Futuro de `common/`

A medida que el proyecto crezca, esta carpeta puede albergar también:

```
common/
├── entities/
│   └── BaseEntity.ts
├── decorators/          → Decoradores personalizados (ej: @CurrentUser())
├── guards/              → Guards reutilizables (ej: AuthGuard, RolesGuard)
├── interceptors/        → Interceptors globales (ej: AuditInterceptor para poblar created_by)
├── pipes/               → Pipes de validación global
├── filters/             → Exception filters globales
└── dto/                 → DTOs genéricos (ej: PaginationDto)
```

---

## 🗄️ Modelo de Base de Datos

### Diagrama de Entidades

El sistema cuenta con **8 entidades principales** organizadas en dos grupos funcionales:

**Grupo Operativo (Backend NestJS):**
- `SUCURSAL`
- `INSUMO`
- `INVENTARIO_SUCURSAL`
- `TRASPASO_MERCADERIA`
- `EMPLEADO`
- `ASISTENCIA`

**Grupo Chatbot (WhatsApp):**
- `SESION_WHATSAPP`
- `LOG_CHATBOT`

---

## 📋 Descripción de Entidades

> ℹ️ **Todos los campos `id` son `string UUID`** heredados de `BaseEntity`. Además, cada entidad incluye implícitamente los campos de auditoría: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`. Estos no se repiten en cada tabla para mayor claridad.

### 1. `SUCURSAL` — Módulo: `branch`

Representa cada punto físico del negocio (tienda).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string UUID (PK) | Heredado de `BaseEntity` |
| `nombre` | string | Ej: `Central`, `Sucursal 2` |
| `direccion` | string | Dirección física |
| `horarios_atencion` | string | Dato consumido por el Chatbot |
| `link_ubicacion` | string | Link de Google Maps para WhatsApp |
| *(auditoría)* | — | Heredados de `BaseEntity` |

---

### 2. `INSUMO` — Módulo: `supply`

Catálogo maestro de productos/insumos del negocio.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string UUID (PK) | Heredado de `BaseEntity` |
| `nombre` | string | Ej: `Tinta Negra`, `Repuesto X` |
| `categoria` | string | Agrupación del insumo |
| `unidad_medida` | string | Ej: `litros`, `unidades` |
| *(auditoría)* | — | Heredados de `BaseEntity` |

---

### 3. `INVENTARIO_SUCURSAL` — Módulo: `inventory`

Controla el stock actual de cada insumo en cada sucursal.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string UUID (PK) | Heredado de `BaseEntity` |
| `sucursal_id` | string UUID (FK → SUCURSAL) | Sucursal a la que pertenece |
| `insumo_id` | string UUID (FK → INSUMO) | Insumo almacenado |
| `cantidad_actual` | int | Stock disponible en este momento |
| `stock_minimo` | int | Umbral para disparar alertas de reposición |
| *(auditoría)* | — | Heredados de `BaseEntity` |

---

### 4. `TRASPASO_MERCADERIA` — Módulo: `stock-transfer`

Registra los movimientos de insumos entre sucursales.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string UUID (PK) | Heredado de `BaseEntity` |
| `sucursal_origen_id` | string UUID (FK → SUCURSAL) | Sucursal que envía |
| `sucursal_destino_id` | string UUID (FK → SUCURSAL) | Sucursal que recibe |
| `insumo_id` | string UUID (FK → INSUMO) | Insumo trasladado |
| `cantidad` | int | Cantidad a trasladar |
| `fecha_solicitud` | datetime | Cuándo se solicitó el traspaso |
| `fecha_recepcion` | datetime | Cuándo se recibió |
| `estado` | string enum | `En Tránsito` / `Recibido` / `Rechazado` |
| *(auditoría)* | — | Heredados de `BaseEntity` |

---

### 5. `EMPLEADO` — Módulo: `employee`

Datos del personal asignado a cada sucursal.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string UUID (PK) | Heredado de `BaseEntity` |
| `sucursal_id` | string UUID (FK → SUCURSAL) | Sucursal donde trabaja |
| `nombre_completo` | string | Nombre del empleado |
| `pin_acceso` | string | PIN hasheado para registro rápido en la PWA |
| `cargo` | string | Puesto del empleado |
| `activo` | boolean | Si el empleado está activo o no |
| *(auditoría)* | — | Heredados de `BaseEntity` |

---

### 6. `ASISTENCIA` — Módulo: `attendance`

Registro de entradas y salidas del personal.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string UUID (PK) | Heredado de `BaseEntity` |
| `empleado_id` | string UUID (FK → EMPLEADO) | Empleado al que pertenece el registro |
| `fecha_registro` | date | Día del registro |
| `hora_ingreso` | datetime | Hora de entrada |
| `hora_salida` | datetime | Hora de salida |
| `estado_ingreso` | string enum | `Puntual` / `Atraso` / `Falta` |
| `horas_trabajadas` | decimal | Calculado automáticamente |
| *(auditoría)* | — | Heredados de `BaseEntity` |

---

### 7. `SESION_WHATSAPP` *(Chatbot)*

Estado de la conversación activa de un cliente en WhatsApp. Esta entidad **no extiende `BaseEntity`** ya que su PK es el número de teléfono, no un UUID generado.

| Campo | Tipo | Descripción |
|---|---|---|
| `numero_telefono` | string (PK) | Identificador único del cliente |
| `nombre_perfil` | string | Nombre del contacto en WhatsApp |
| `estado_flujo` | string | Ej: `Menu_Principal`, `Esperando_Opcion` |
| `ultima_interaccion` | datetime | Última vez que interactuó |

---

### 8. `LOG_CHATBOT` *(Chatbot)*

Historial de intenciones detectadas por el bot para análisis y auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string UUID (PK) | Heredado de `BaseEntity` |
| `numero_telefono` | string (FK → SESION_WHATSAPP) | Cliente que realizó la consulta |
| `intencion_detectada` | string | Ej: `Consultar_Horario`, `Consultar_Ubicacion` |
| `fecha_hora` | datetime | Momento del registro |
| *(auditoría)* | — | Heredados de `BaseEntity` |

---

## 🔗 Relaciones entre Entidades

### Diagrama de Relaciones (texto)

```
SUCURSAL ──────────────────── almacena ──────────────── INVENTARIO_SUCURSAL
   │                                                            │
   │                                                            │
   │ asigna a                                             se controla en
   │                                                            │
EMPLEADO                                                     INSUMO
   │                                                            │
   │ registra                                           se moviliza en
   │                                                            │
ASISTENCIA                                            TRASPASO_MERCADERIA
                                                      (origen / destino → SUCURSAL)

SESION_WHATSAPP ── registra actividad ── LOG_CHATBOT
       │
       └── envía/recibe ── SUCURSAL  (consulta horarios, ubicación)
```

---

### Detalle de Relaciones

| Relación | Tipo | Descripción |
|---|---|---|
| `SUCURSAL` → `INVENTARIO_SUCURSAL` | **1 : N** | Una sucursal almacena muchos registros de inventario |
| `INSUMO` → `INVENTARIO_SUCURSAL` | **1 : N** | Un insumo puede estar en varias sucursales |
| `SUCURSAL` → `TRASPASO_MERCADERIA` (origen) | **1 : N** | Una sucursal puede enviar muchos traspasos |
| `SUCURSAL` → `TRASPASO_MERCADERIA` (destino) | **1 : N** | Una sucursal puede recibir muchos traspasos |
| `INSUMO` → `TRASPASO_MERCADERIA` | **1 : N** | Un insumo puede movilizarse en varios traspasos |
| `SUCURSAL` → `EMPLEADO` | **1 : N** | Una sucursal puede tener muchos empleados |
| `EMPLEADO` → `ASISTENCIA` | **1 : N** | Un empleado tiene muchos registros de asistencia |
| `SESION_WHATSAPP` → `LOG_CHATBOT` | **1 : N** | Una sesión puede generar múltiples logs de actividad |
| `SESION_WHATSAPP` → `SUCURSAL` | **N : 1** | El bot consulta datos de las sucursales (horarios, ubicación) |

---

## 🗺️ Mapa Módulo ↔ Entidad

| Módulo NestJS | Entidad DB | Responsabilidad |
|---|---|---|
| `branch` | `SUCURSAL` | CRUD de sucursales, horarios, ubicación |
| `supply` | `INSUMO` | CRUD de insumos/suministros del catálogo |
| `inventory` | `INVENTARIO_SUCURSAL` | Stock por sucursal, alertas de mínimo |
| `stock-transfer` | `TRASPASO_MERCADERIA` | Solicitudes y seguimiento de traspasos |
| `employee` | `EMPLEADO` | Alta, baja y modificación de personal |
| `attendance` | `ASISTENCIA` | Registro de ingreso/salida, cálculo de horas |
| *(por definir)* | `SESION_WHATSAPP` | Gestión del estado de sesión del chatbot |
| *(por definir)* | `LOG_CHATBOT` | Auditoría de intenciones del chatbot |

---
