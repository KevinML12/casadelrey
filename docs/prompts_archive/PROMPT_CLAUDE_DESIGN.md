# Prompt para Claude Design — ERD Casa del Rey

> Copia todo lo que está debajo de esta línea y pégalo en Claude Design.

---

Genera un diagrama de base de datos (ERD) para un sistema de gestión de iglesia llamado **Casa del Rey**. Usa el esquema que te doy abajo. Quiero que el resultado sea un diagrama visual limpio, con tablas bien organizadas, colores por dominio y líneas de relación claras.

## Instrucciones de diseño

**Colores por dominio:**
- 🔵 Azul `#DAE8FC` — Auth / Usuarios (`users`, `cells`)
- 🟢 Verde `#D5E8D4` — Células (`cell_reports`, `member_boletas`)
- 🟠 Naranja `#FFE6CC` — Eventos y Pagos (`events`, `event_registrations`, `payment_receipts`, `donations`)
- 🟣 Morado `#E1D5E7` — Contenido y Personas (`posts`, `announcements`, `volunteers`, `petitions`, `gallery_photos`, `social_posts`)
- ⚫ Gris `#F5F5F5` — Sistema (`user_goals`, `activity_logs`)

**Campos especiales:**
- Fondo amarillo `#FFF2CC` = campo NUEVO (pendiente de agregar)
- Fondo rojo/rosa `#F8CECC` = campo a DEPRECAR (reemplazado por FK)
- Negrita = clave primaria (PK)
- Prefijo FK = clave foránea

**Layout sugerido:**
Organiza las tablas en grupos lógicos. El centro del diagrama debe ser `users` ya que casi todo se relaciona con ella.

---

## Esquema completo

### users (azul)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| name | varchar(100) | |
| email | varchar(100) | UNIQUE |
| password | varchar(255) | bcrypt |
| role | varchar(20) | admin\|leader\|volunteer\|member |
| address | varchar(255) | |
| phone | varchar(30) | 🆕 NUEVO |
| cell_id | int FK→cells | 🆕 NUEVO |
| cell_code | varchar(10) | ⚠️ deprecar |
| cell_type | varchar(20) | ⚠️ deprecar |
| email_verified | bool | |
| created_at / updated_at / deleted_at | timestamptz | |

### cells ✨ NUEVA (azul)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| code | varchar(10) | UNIQUE — H1, M2, J3… |
| name | varchar(100) | Guerreros del Rey |
| type | varchar(20) | hombres\|mujeres\|jovenes\|prejus\|ninos |
| leader_id | int FK→users | |
| pastor_id | int FK→users | nullable |
| is_active | bool | |
| created_at / updated_at / deleted_at | timestamptz | |

### cell_reports (verde)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| cell_id | int FK→cells | 🆕 NUEVO |
| cell_code | varchar(20) | ⚠️ deprecar |
| cell_name | varchar(100) | |
| cell_type | varchar(20) | ⚠️ deprecar |
| meeting_date | varchar(20) | |
| leader_id | int FK→users | |
| leader_name | varchar(100) | ⚠️ deprecar |
| pastor_id | int FK→users | 🆕 NUEVO |
| pastor_name | varchar(100) | ⚠️ deprecar |
| host_name / host_phone / address | varchar | |
| topic | varchar(255) | |
| total_attendees / converts / reconciled / new_members | int | |
| offering | decimal(10,2) | |
| photo_url | varchar(500) | |
| status | varchar(20) | pendiente\|aprobado\|rechazado |
| approved_by_id | int FK→users | |
| notes | text | |
| created_at / updated_at / deleted_at | timestamptz | |

### member_boletas (verde)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| date | varchar(20) | |
| category | varchar(30) | convertido\|reconciliado\|nuevo |
| inviter_name / inviter_phone | varchar | |
| inviter_user_id | int FK→users | 🆕 NUEVO |
| guest_name / guest_phone / address | varchar | |
| leader_id | int FK→users | |
| cell_report_id | int FK→cell_reports | nullable |
| notes | text | |
| created_at / updated_at / deleted_at | timestamptz | |

### events (naranja)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| title / location / description | varchar/text | |
| date | varchar(20) | |
| time | varchar(10) | 🆕 NUEVO |
| is_active | bool | |
| requires_payment | bool | 🆕 NUEVO |
| price_gtq | decimal(10,2) | 🆕 NUEVO |
| payment_deadline | varchar(20) | 🆕 NUEVO |
| created_at / updated_at / deleted_at | timestamptz | |

### event_registrations (naranja)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| event_id | int FK→events | |
| user_id | int FK→users | nullable (anónimo) |
| name / email / phone | varchar | |
| attendee_count | int | DEFAULT 1 |
| notes | text | |
| payment_status | varchar(20) | 🆕 NUEVO |
| receipt_id | int FK→payment_receipts | 🆕 NUEVO |
| created_at / updated_at / deleted_at | timestamptz | |

### payment_receipts ✨ NUEVA (naranja)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| payer_name / payer_email / payer_phone | varchar | |
| amount | decimal(10,2) | |
| bank_name | varchar(100) | Banrural, BAC, G&T... |
| reference_number | varchar(255) | |
| receipt_image_url | varchar(500) | Supabase Storage |
| purpose | varchar(50) | evento\|donacion\|inscripcion |
| event_id | int FK→events | nullable |
| donation_id | int FK→donations | nullable |
| status | varchar(20) | pendiente\|verificado\|rechazado |
| verified_by_id | int FK→users | nullable |
| verified_at / rejection_reason | timestamptz/varchar | |
| created_at / updated_at / deleted_at | timestamptz | |

### donations (naranja)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| name / email | varchar | |
| user_id | int FK→users | 🆕 NUEVO nullable |
| amount / currency | decimal/varchar | |
| payment_method / payment_reference | varchar | |
| receipt_url | varchar(500) | |
| receipt_id | int FK→payment_receipts | 🆕 NUEVO |
| is_successful / donation_purpose | bool/varchar | |
| created_at / updated_at / deleted_at | timestamptz | |

### volunteers (morado)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| name / email / phone | varchar | |
| department | varchar(50) | alabanza\|danza\|servidores... |
| message | text | |
| assigned_leader_id | int FK→users | nullable |
| user_id | int FK→users | 🆕 NUEVO nullable |
| status | varchar(20) | pendiente\|asignado\|usuario_creado |
| created_at / updated_at / deleted_at | timestamptz | |

### petitions (morado)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| name / email / phone | varchar | |
| category / subject / message | varchar/text | |
| is_answered | bool | |
| user_id | int FK→users | 🆕 NUEVO nullable |
| created_at / updated_at / deleted_at | timestamptz | |

### posts (morado)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| title / slug / excerpt | varchar | slug UNIQUE |
| content / cover_image | text/varchar | |
| redirect_url | varchar(500) | link a red social |
| social_platform | varchar(20) | 🆕 NUEVO |
| author_id | int FK→users | |
| status / view_count | varchar/bigint | draft\|published |
| created_at / updated_at / deleted_at | timestamptz | |

### announcements (morado)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| title / content | varchar/text | |
| role_target | varchar(20) | all\|member\|leader\|admin |
| is_active / published_at | bool/timestamptz | |
| expires_at | timestamptz | 🆕 NUEVO |
| created_by_id | int FK→users | |
| created_at / updated_at / deleted_at | timestamptz | |

### gallery_photos (morado)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| title / description | varchar/text | |
| url / thumbnail_url | varchar(500) | Supabase Storage |
| event_id | int FK→events | nullable |
| uploaded_by_id | int FK→users | |
| is_active / sort_order | bool/int | |
| created_at / updated_at / deleted_at | timestamptz | |

### social_posts (morado)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| platform | varchar(20) | facebook\|instagram |
| post_url / caption / image_url | varchar | |
| is_active / sort_order | bool/int | |
| created_at / updated_at / deleted_at | timestamptz | |

### user_goals (gris)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| user_id | int FK→users | |
| title / description | varchar/text | |
| target_date | varchar(20) | |
| completed | bool | |
| completed_at | timestamptz | 🆕 NUEVO |
| created_at / updated_at / deleted_at | timestamptz | |

### activity_logs (gris)
| Campo | Tipo | Nota |
|---|---|---|
| **id** | serial PK | |
| user_id | int FK→users | |
| user_name | varchar(100) | desnormalizado para velocidad |
| action / resource / resource_id | varchar/int | create\|update\|delete\|approve |
| details / ip_address | text/varchar | |
| created_at | timestamptz | sin soft delete — es un log |

---

## Relaciones

```
users           ||--o{ cells                : "lidera (leader_id)"
users           ||--o{ cells                : "pastora (pastor_id)"
users           }o--o| cells                : "pertenece a (cell_id)"
users           ||--o{ cell_reports         : "envía reporte"
users           ||--o{ member_boletas       : "registra boleta"
users           ||--o{ volunteers           : "es voluntario"
users           ||--o{ user_goals           : "tiene metas"
users           ||--o{ posts                : "autor"
users           ||--o{ announcements        : "crea"
users           ||--o{ petitions            : "envía"
users           ||--o{ activity_logs        : "genera"
cells           ||--o{ cell_reports         : "tiene reportes"
cell_reports    ||--o{ member_boletas       : "asocia boletas"
events          ||--o{ event_registrations  : "tiene registros"
events          ||--o{ gallery_photos       : "tiene fotos"
events          ||--o{ payment_receipts     : "recibe pagos"
event_registrations }o--o| payment_receipts : "comprobante de pago"
payment_receipts }o--o| donations           : "aplica a donación"
```

---

## Notas de contexto

- Sistema para iglesia guatemalteca (~200 miembros, 20 líderes)
- Stack: Go + PostgreSQL (Supabase)
- Las células son grupos de ~15-30 personas que se reúnen semanalmente
- Los reportes de célula requieren aprobación del pastor
- Las boletas registran nuevos visitantes/convertidos
- Los comprobantes bancarios son fotos de depósitos en bancos guatemaltecos
