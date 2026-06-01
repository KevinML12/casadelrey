# Esquema de Base de Datos — Casa del Rey
> Diseño normalizado · Junio 2026

---

## Límites Supabase Free Tier

| Recurso | Límite | Estimado actual | Estimado 1 año |
|---|---|---|---|
| Base de datos | 500 MB | ~2 MB | ~15 MB |
| Storage (archivos) | 1 GB | ~50 MB | ~400 MB |
| Bandwidth | 2 GB/mes | ~100 MB | creciente |
| Conexiones | 60 directas | — | — |

**Mayor riesgo:** `activity_logs` (crece ilimitado) y fotos de células (500KB c/u).
**Estrategia:** auto-purge de logs > 6 meses, compresión de imágenes en upload.

---

## Problemas del esquema actual

| Tabla | Problema | Solución |
|---|---|---|
| `cell_reports` | `leader_name` (string) duplica `leader_id` (FK) | Eliminar `leader_name`, usar JOIN |
| `cell_reports` | `pastor_name` (string) sin FK | Agregar `pastor_id → users` |
| `cell_reports` | `cell_code/name/type` se repite en cada reporte | Crear tabla `cells`, agregar `cell_id` FK |
| `users` | `cell_code/cell_type` como strings sueltos | Reemplazar con `cell_id → cells` |
| `volunteers` | No tiene `user_id` FK al usuario creado | Agregar `user_id → users` |
| `paypal_orders` | Muerta (PayPal removido) | Eliminar |
| `events` | Sin campos de precio ni pago | Agregar `requires_payment`, `price_gtq` |
| `event_registrations` | Sin estado de pago | Agregar `payment_status`, `receipt_id` |
| `activity_logs` | Crece sin límite | Agregar política de purge cada 6 meses |

---

## Esquema objetivo (normalizado)

### `users`
```sql
id               serial PK
created_at       timestamptz
updated_at       timestamptz
deleted_at       timestamptz (soft delete)

name             varchar(100) NOT NULL
email            varchar(100) UNIQUE NOT NULL
password         varchar(255) NOT NULL          -- bcrypt hash
role             varchar(20) DEFAULT 'member'   -- admin | leader | volunteer | member
address          varchar(255)
phone            varchar(30)                    -- NUEVO (faltaba)

-- Auth
email_verified           bool DEFAULT false
verification_token       varchar(255) INDEX
verification_token_expiry timestamptz
reset_token              varchar(255) INDEX
reset_token_expiry       timestamptz

-- Célula (solo líderes)
cell_id          int FK → cells (nullable)      -- NUEVO, reemplaza cell_code+cell_type
cell_code        varchar(10)                    -- mantener durante migración
cell_type        varchar(20)                    -- mantener durante migración
```

---

### `cells` *(NUEVA — normaliza las células)*
```sql
id               serial PK
created_at       timestamptz
updated_at       timestamptz
deleted_at       timestamptz

code             varchar(10) UNIQUE NOT NULL    -- H1, M2, J3…
name             varchar(100) NOT NULL           -- Guerreros del Rey
type             varchar(20) NOT NULL           -- hombres|mujeres|jovenes|prejus|ninos
leader_id        int FK → users NOT NULL
pastor_id        int FK → users (nullable)      -- pastor asignado a la célula
is_active        bool DEFAULT true
```

**Por qué:** actualmente el código H1 existe en `users.cell_code` Y en cada `cell_reports.cell_code`. Con esta tabla, el código vive una sola vez.

---

### `cell_reports`
```sql
id               serial PK
created_at / updated_at / deleted_at

-- Identificación (SIMPLIFICADO)
cell_id          int FK → cells (nullable)      -- NUEVO, fuente de verdad
cell_code        varchar(20)                    -- mantener para reportes históricos
cell_name        varchar(100) NOT NULL
cell_type        varchar(20)
meeting_date     varchar(20) NOT NULL

-- Responsables (SIMPLIFICADO)
leader_id        int FK → users (nullable)
leader_name      varchar(100)                   -- deprecar tras migración
pastor_id        int FK → users (nullable)      -- NUEVO, reemplaza pastor_name
pastor_name      varchar(100)                   -- deprecar tras migración

-- Anfitrión
host_name        varchar(100)
host_phone       varchar(30)
address          varchar(255)

-- Contenido
topic            varchar(255)
notes            text

-- Números
total_attendees  int DEFAULT 0
converts         int DEFAULT 0
reconciled       int DEFAULT 0
new_members      int DEFAULT 0                  -- computed: converts + reconciled
offering         decimal(10,2) DEFAULT 0

-- Media
photo_url        varchar(500)

-- Aprobación
status           varchar(20) DEFAULT 'pendiente' -- pendiente|aprobado|rechazado
approved_by_id   int FK → users (nullable)
approved_at      timestamptz
```

---

### `member_boletas`
```sql
id               serial PK
created_at / updated_at / deleted_at

date             varchar(20) NOT NULL
category         varchar(30) NOT NULL           -- reconciliado|convertido|nuevo

-- Invitador
inviter_name     varchar(100)
inviter_phone    varchar(30)
inviter_user_id  int FK → users (nullable)      -- NUEVO: si el invitador es miembro registrado

-- Invitado
guest_name       varchar(100) NOT NULL
guest_phone      varchar(30)
address          varchar(255)

-- Relaciones
leader_id        int FK → users (nullable)
cell_report_id   int FK → cell_reports (nullable)
notes            text
```

---

### `events`
```sql
id               serial PK
created_at / updated_at / deleted_at

title            varchar(255) NOT NULL
date             varchar(20)
time             varchar(10)                    -- NUEVO: "10:00"
location         varchar(255)
description      text
cover_image      varchar(500)                   -- NUEVO
is_active        bool DEFAULT true

-- Cobros (NUEVO — requerimiento mayo 2026)
requires_payment bool DEFAULT false
price_gtq        decimal(10,2) DEFAULT 0
payment_deadline varchar(20)                    -- fecha límite de pago
```

---

### `event_registrations`
```sql
id               serial PK
created_at / updated_at / deleted_at

event_id         int FK → events NOT NULL
user_id          int FK → users (nullable)      -- nil = anónimo
name             varchar(100) NOT NULL
email            varchar(100) NOT NULL
phone            varchar(30)
attendee_count   int DEFAULT 1
notes            text

-- Pago (NUEVO)
payment_status   varchar(20) DEFAULT 'no_requerido'
                 -- no_requerido | pendiente | verificado | rechazado
receipt_id       int FK → payment_receipts (nullable)
```

---

### `payment_receipts` *(NUEVA — verificación de boletas bancarias)*
```sql
id               serial PK
created_at / updated_at / deleted_at

-- Quién paga
payer_name       varchar(100) NOT NULL
payer_email      varchar(100)
payer_phone      varchar(30)

-- Qué paga
amount           decimal(10,2) NOT NULL
currency         varchar(3) DEFAULT 'GTQ'
bank_name        varchar(100)                   -- Banrural | BAC | G&T | Industrial
reference_number varchar(255)                   -- número de referencia del banco
receipt_image_url varchar(500)                  -- foto del comprobante (Supabase Storage)

-- Para qué
purpose          varchar(50)                    -- evento | donacion | inscripcion
event_id         int FK → events (nullable)
donation_id      int FK → donations (nullable)

-- Verificación (admin)
status           varchar(20) DEFAULT 'pendiente' -- pendiente|verificado|rechazado
verified_by_id   int FK → users (nullable)
verified_at      timestamptz
rejection_reason varchar(255)
```

---

### `donations`
```sql
id               serial PK
created_at / updated_at / deleted_at

name             varchar(100) NOT NULL
email            varchar(100) INDEX
amount           decimal(10,2) NOT NULL
currency         varchar(3) DEFAULT 'GTQ'
payment_method   varchar(50)                    -- transferencia|tigo_money|presencial
payment_reference varchar(255)
receipt_url      varchar(500)
receipt_id       int FK → payment_receipts (nullable)  -- NUEVO
is_successful    bool DEFAULT true
donation_purpose varchar(255)
user_id          int FK → users (nullable)      -- NUEVO: si el donante es miembro
```

---

### `volunteers`
```sql
id               serial PK
created_at / updated_at / deleted_at

name             varchar(100) NOT NULL
email            varchar(100) NOT NULL INDEX
phone            varchar(30)
department       varchar(50)
message          text
assigned_leader_id int FK → users (nullable)
user_id          int FK → users (nullable)      -- NUEVO: FK al usuario creado
status           varchar(20) DEFAULT 'pendiente'
                 -- pendiente|asignado|coordinando|usuario_creado
```

---

### `posts`
```sql
id               serial PK
created_at / updated_at / deleted_at

title            varchar(255) NOT NULL
slug             varchar(255) UNIQUE NOT NULL
content          text
cover_image      varchar(500)
excerpt          text
redirect_url     varchar(500)                   -- link a red social
social_platform  varchar(20)                    -- NUEVO: instagram|facebook|youtube|tiktok
author_id        int FK → users NOT NULL
status           varchar(20) DEFAULT 'draft'    -- draft|published
view_count       bigint DEFAULT 0
```

---

### `petitions`
```sql
id               serial PK
created_at / updated_at / deleted_at

name             varchar(100) NOT NULL
email            varchar(100) INDEX
phone            varchar(20)
category         varchar(50)                    -- personal|familia|salud|ministerio
subject          varchar(255) NOT NULL
message          text NOT NULL
is_answered      bool DEFAULT false
answered_at      timestamptz
user_id          int FK → users (nullable)      -- NUEVO: si viene de un líder logueado
```

---

### `announcements`
```sql
id               serial PK
created_at / updated_at / deleted_at

title            varchar(255) NOT NULL
content          text NOT NULL
role_target      varchar(20) DEFAULT 'all'      -- all|member|leader|volunteer|admin
is_active        bool DEFAULT true
published_at     timestamptz
created_by_id    int FK → users NOT NULL
expires_at       timestamptz                    -- NUEVO: para que desaparezcan solos
```

---

### `gallery_photos`
```sql
id               serial PK
created_at / updated_at / deleted_at

title            varchar(255)
description      text
url              varchar(500) NOT NULL          -- URL en Supabase Storage
thumbnail_url    varchar(500)
event_id         int FK → events (nullable)
uploaded_by_id   int FK → users NOT NULL
is_active        bool DEFAULT true
sort_order       int DEFAULT 0
```

---

### `social_posts`
```sql
id               serial PK
created_at / updated_at / deleted_at

platform         varchar(20) NOT NULL           -- facebook|instagram
post_url         varchar(500) NOT NULL
caption          varchar(500)
image_url        varchar(500)
is_active        bool DEFAULT true
sort_order       int DEFAULT 0
```

---

### `user_goals`
```sql
id               serial PK
created_at / updated_at / deleted_at

user_id          int FK → users NOT NULL INDEX
title            varchar(255) NOT NULL
description      text
target_date      varchar(20)
completed        bool DEFAULT false
completed_at     timestamptz                    -- NUEVO
```

---

### `activity_logs`
```sql
id               serial PK
created_at       timestamptz                    -- sin soft delete (es un log)

user_id          int FK → users INDEX
user_name        varchar(100)
action           varchar(50) NOT NULL           -- create|update|delete|approve|login
resource         varchar(50) NOT NULL
resource_id      int
details          text
ip_address       varchar(45)
```
> **Política de retención:** purge automático de registros con `created_at < NOW() - INTERVAL '6 months'`

---

### Tablas a eliminar

| Tabla | Razón |
|---|---|
| `paypal_orders` | PayPal removido del sistema |

---

## Tablas futuras (roadmap)

### `sermon_series`
```sql
id, title, description, cover_image, is_active, sort_order
```

### `sermons`
```sql
id, series_id FK, title, speaker_id FK → users,
date, video_url, audio_url, notes_url,
duration_minutes, view_count, is_published
```

### `service_schedules`
```sql
id, day_of_week (0-6), time, type (culto|celula|oracion),
location, description, is_active
```

### `connect_cards` *(tarjeta de conexión para visitantes nuevos)*
```sql
id, created_at,
name, phone, email,
how_found (invitacion|redes|publicidad|otro),
category (primera_vez|reconciliado|busco_celula),
leader_assigned_id FK → users (nullable),
status (nuevo|contactado|integrado)
```

---

## Estrategia de migración (sin downtime)

### Fase 1 — Agregar sin romper (esta semana)
Columnas `nullable` nuevas vía `AutoMigrate`:
- `cells` tabla nueva
- `users.cell_id`, `users.phone`
- `volunteers.user_id`
- `events.requires_payment`, `events.price_gtq`, `events.time`
- `event_registrations.payment_status`, `event_registrations.receipt_id`
- `payment_receipts` tabla nueva
- `posts.social_platform`
- `petitions.user_id`
- `announcements.expires_at`
- `user_goals.completed_at`
- `donations.user_id`, `donations.receipt_id`
- `member_boletas.inviter_user_id`
- `cell_reports.cell_id`, `cell_reports.pastor_id`

### Fase 2 — Migrar datos (script one-shot)
- Poblar `cells` desde los `cell_reports` existentes
- Asignar `cell_id` en `users` donde `cell_code` no está vacío
- Asignar `cell_id` en `cell_reports` desde `cell_code`
- Asignar `user_id` en `volunteers` donde `status = 'usuario_creado'`

### Fase 3 — Deprecar campos redundantes
- `cell_reports.leader_name` → `NOT NULL` en `leader_id`
- `cell_reports.pastor_name` → `NOT NULL` en `pastor_id`
- `users.cell_code`, `users.cell_type` → eliminar tras confirmar `cell_id`
- Eliminar tabla `paypal_orders`

---

## Estimación de tamaño en Supabase Free (500 MB)

| Tabla | Filas/año | KB/fila | MB/año |
|---|---|---|---|
| users | 200 | 1 | 0.2 |
| cell_reports | 500 | 2 | 1.0 |
| member_boletas | 1000 | 0.5 | 0.5 |
| activity_logs | 10000 | 0.3 | 3.0 |
| donations | 500 | 0.5 | 0.25 |
| posts | 100 | 5 | 0.5 |
| petitions | 200 | 1 | 0.2 |
| **Total DB** | | | **~6 MB/año** |

**Storage (archivos):**
- Fotos de células: 500 fotos × 300KB (comprimidas) = 150MB/año
- Galería: 50 fotos × 500KB = 25MB/año
- Comprobantes pago: 200 × 200KB = 40MB/año
- **Total Storage: ~215 MB/año**

**Conclusión:** el free tier aguanta cómodamente 2+ años. Cuando se llegue al límite, Supabase Pro cuesta $25/mes con 8GB DB y 100GB Storage.
