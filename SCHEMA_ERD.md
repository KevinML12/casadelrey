# ERD — Casa del Rey

```mermaid
erDiagram

    users {
        serial id PK
        varchar name
        varchar email
        varchar password
        varchar role
        varchar address
        varchar phone
        int cell_id FK
        varchar cell_code
        varchar cell_type
        bool email_verified
        timestamptz created_at
    }

    cells {
        serial id PK
        varchar code
        varchar name
        varchar type
        int leader_id FK
        int pastor_id FK
        bool is_active
    }

    cell_reports {
        serial id PK
        int cell_id FK
        varchar cell_code
        varchar cell_name
        varchar cell_type
        varchar meeting_date
        int leader_id FK
        int pastor_id FK
        varchar host_name
        varchar host_phone
        varchar address
        varchar topic
        int total_attendees
        int converts
        int reconciled
        int new_members
        decimal offering
        varchar photo_url
        varchar status
        int approved_by_id FK
        timestamptz created_at
    }

    member_boletas {
        serial id PK
        varchar date
        varchar category
        varchar inviter_name
        int inviter_user_id FK
        varchar guest_name
        varchar guest_phone
        varchar address
        int leader_id FK
        int cell_report_id FK
        timestamptz created_at
    }

    events {
        serial id PK
        varchar title
        varchar date
        varchar time
        varchar location
        text description
        bool is_active
        bool requires_payment
        decimal price_gtq
        varchar payment_deadline
    }

    event_registrations {
        serial id PK
        int event_id FK
        int user_id FK
        varchar name
        varchar email
        int attendee_count
        varchar payment_status
        int receipt_id FK
        timestamptz created_at
    }

    payment_receipts {
        serial id PK
        varchar payer_name
        varchar payer_email
        decimal amount
        varchar bank_name
        varchar reference_number
        varchar receipt_image_url
        varchar purpose
        int event_id FK
        int donation_id FK
        varchar status
        int verified_by_id FK
        timestamptz created_at
    }

    donations {
        serial id PK
        varchar name
        varchar email
        int user_id FK
        decimal amount
        varchar payment_method
        varchar payment_reference
        int receipt_id FK
        bool is_successful
        varchar donation_purpose
        timestamptz created_at
    }

    volunteers {
        serial id PK
        varchar name
        varchar email
        varchar department
        int assigned_leader_id FK
        int user_id FK
        varchar status
        timestamptz created_at
    }

    petitions {
        serial id PK
        varchar name
        varchar email
        varchar category
        varchar subject
        text message
        bool is_answered
        int user_id FK
        timestamptz created_at
    }

    posts {
        serial id PK
        varchar title
        varchar slug
        text content
        varchar redirect_url
        varchar social_platform
        int author_id FK
        varchar status
        bigint view_count
        timestamptz created_at
    }

    announcements {
        serial id PK
        varchar title
        text content
        varchar role_target
        bool is_active
        timestamptz expires_at
        int created_by_id FK
        timestamptz created_at
    }

    gallery_photos {
        serial id PK
        varchar title
        varchar url
        int event_id FK
        int uploaded_by_id FK
        bool is_active
        timestamptz created_at
    }

    social_posts {
        serial id PK
        varchar platform
        varchar post_url
        varchar caption
        bool is_active
        int sort_order
    }

    user_goals {
        serial id PK
        int user_id FK
        varchar title
        text description
        varchar target_date
        bool completed
        timestamptz completed_at
    }

    activity_logs {
        serial id PK
        int user_id FK
        varchar action
        varchar resource
        int resource_id
        text details
        varchar ip_address
        timestamptz created_at
    }

    %% ── Relaciones ──────────────────────────────────────────────────
    users           ||--o{ cells                : "lidera"
    users           ||--o{ cells                : "pastora"
    users           ||--o{ cell_reports         : "reporta"
    users           ||--o{ member_boletas       : "registra"
    users           ||--o{ volunteers           : "es voluntario"
    users           ||--o{ user_goals           : "tiene metas"
    users           ||--o{ posts                : "autor"
    users           ||--o{ announcements        : "crea"
    users           ||--o{ petitions            : "envia"
    users           ||--o{ activity_logs        : "genera log"
    users           }o--|| cells                : "pertenece a"

    cells           ||--o{ cell_reports         : "tiene reportes"

    cell_reports    ||--o{ member_boletas       : "incluye boletas"

    events          ||--o{ event_registrations  : "tiene registros"
    events          ||--o{ gallery_photos       : "tiene fotos"
    events          ||--o{ payment_receipts     : "recibe pagos"

    event_registrations }o--o| payment_receipts : "pago"

    payment_receipts }o--o| donations           : "aplica a donacion"

    donations       }o--o| payment_receipts     : "comprobante"
```

---

## Leyenda de campos nuevos (Fase 1)

| Campo | Tabla | Descripción |
|---|---|---|
| `phone` | users | Teléfono del usuario |
| `cell_id` | users | FK a tabla cells (reemplaza cell_code/cell_type) |
| `time` | events | Hora del evento |
| `requires_payment` | events | Si requiere pago para inscribirse |
| `price_gtq` | events | Precio en quetzales |
| `payment_deadline` | events | Fecha límite de pago |
| `payment_status` | event_registrations | Estado del pago |
| `receipt_id` | event_registrations | FK al comprobante bancario |
| `user_id` | donations | FK al usuario si es miembro |
| `receipt_id` | donations | FK al comprobante |
| `inviter_user_id` | member_boletas | FK si el invitador es miembro |
| `pastor_id` | cell_reports | FK al pastor (reemplaza pastor_name) |
| `cell_id` | cell_reports | FK a tabla cells |
| `user_id` | volunteers | FK al usuario creado |
| `user_id` | petitions | FK al líder que envía |
| `social_platform` | posts | Plataforma del redirect_url |
| `expires_at` | announcements | Auto-expiración del anuncio |
| `completed_at` | user_goals | Timestamp de completado |

## Tablas nuevas

| Tabla | Propósito |
|---|---|
| `cells` | Normaliza las células (evita strings repetidos en cell_reports y users) |
| `payment_receipts` | Verifica comprobantes bancarios para pagos de eventos y donaciones |

## Tabla a eliminar

| Tabla | Razón |
|---|---|
| `paypal_orders` | PayPal fue removido del sistema en mayo 2026 |
