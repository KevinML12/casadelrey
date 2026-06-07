# Estado Anterior — Casa del Rey

> Snapshot del sistema al **24 mayo 2026**, antes de aplicar los nuevos requerimientos.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 7 + Tailwind CSS 3 |
| Backend | Go 1.24 + Echo v4 |
| Base de datos | PostgreSQL vía Supabase + GORM |
| Auth | JWT propio (golang-jwt/v5) |
| Email | SendGrid |
| Pagos | PayPal (create order → approve → capture) |
| Deploy backend | Fly.io (región SCL) |
| Deploy frontend | SiteGround / Vercel (build estático) |

---

## Modelos de base de datos

### User
```
id, name, email, password, role (member|leader|volunteer|admin),
address, cell_code, cell_type, reset_token, email_verified,
verification_token
```

### Post (Blog)
```
id, title, slug, content, cover_image, excerpt,
redirect_url, author_id, status (draft|published), view_count
```

### Petition (Oración)
```
id, name, email, phone, category, subject, message,
is_answered, answered_at
```

### Donation
```
id, name, email, amount, currency, payment_method
(transferencia|tigo_money|presencial), payment_reference,
receipt_url, is_successful, donation_purpose
```

### PayPalOrder *(tabla temporal)*
```
order_id (PK), name, email, amount, currency, purpose, created_at
```

### Event
```
id, title, date, location, description, is_active
```

### EventRegistration
```
id, event_id, user_id (nullable), name, email, phone,
attendee_count, notes
```

### CellReport
```
id, cell_code, cell_name, cell_type (hombres|mujeres|jovenes|prejus|ninos),
meeting_date, leader_id, leader_name, pastor_name,
host_name, host_phone, address, topic,
total_attendees, converts, reconciled, new_members, offering,
photo_url, notes,
status (pendiente|aprobado|rechazado), approved_by_id, approved_at
```

### MemberBoleta
```
id, date, inviter_name, inviter_phone, guest_name, guest_phone,
address, category (reconciliado|convertido|nuevo),
leader_id, cell_report_id, notes
```

### Volunteer
```
id, name, email, phone, department, message,
assigned_leader_id, status (pendiente|asignado|coordinando|usuario_creado)
```

### UserGoal
```
id, user_id, title, description, target_date, completed
```

### Announcement
```
id, title, content, role_target (all|member|leader|admin),
is_active, published_at, created_by_id
```

### GalleryPhoto
```
id, title, description, url, thumbnail_url, event_id,
uploaded_by_id, is_active, sort_order
```

### SocialPost
```
id, platform (facebook|instagram), post_url, caption,
image_url, is_active, sort_order
```

### ActivityLog
```
id, user_id, user_name, action, resource, resource_id, details, ip_address
```

---

## Endpoints API (`/api/v1`)

### Públicos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/blog` | Listar posts publicados |
| GET | `/blog/:slug` | Post individual |
| POST | `/contact/petition` | Enviar petición de oración |
| GET | `/events` | Listar eventos |
| POST | `/events/:id/rsvp` | Registrarse a evento |
| GET | `/social/feed` | Feed Facebook/Instagram |
| GET | `/announcements` | Anuncios activos |
| GET | `/gallery` | Galería de fotos |
| POST | `/volunteer/register` | Registrarse como voluntario |
| GET | `/volunteer/departments` | Lista de departamentos |
| POST | `/auth/login` | Login |
| GET | `/auth/verify-email` | Verificar email |
| POST | `/auth/forgot-password` | Recuperar contraseña |
| POST | `/auth/reset-password` | Resetear contraseña |
| POST | `/donations/register` | Registrar donación local |
| POST | `/donations/create-paypal-order` | Crear orden PayPal |
| POST | `/donations/capture-paypal-order` | Capturar orden PayPal |

### Admin
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/kpis` | Métricas globales |
| GET/PUT | `/admin/users`, `/admin/users/:id/role` | Gestión usuarios |
| GET/POST/PUT/DELETE | `/admin/blog/:id` | Blog CRUD |
| GET/POST/PUT/DELETE | `/admin/events/:id` | Eventos CRUD |
| GET/PUT | `/admin/petitions/:id/read` | Peticiones |
| GET/PUT | `/admin/volunteers/:id/assign` | Voluntarios |
| GET/POST/PUT | `/admin/cell-reports/:id/approve` | Reportes célula |
| GET/POST/PUT/DELETE | `/admin/boletas/:id` | Boletas CRUD |
| GET/POST/PUT/DELETE | `/admin/announcements/:id` | Anuncios CRUD |
| GET/POST/PUT/DELETE | `/admin/gallery/:id` | Galería CRUD |
| GET | `/admin/activity-log` | Auditoría |
| **GET** | **`/admin/export/cell-reports`** | **CSV reportes célula** |
| **GET** | **`/admin/export/donations`** | **CSV donaciones** |
| **GET** | **`/admin/export/boletas`** | **CSV boletas** |

### Líder
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/leader/kpis` | KPIs del líder |
| GET | `/leader/cell-directory` | Directorio de miembros |

---

## Páginas frontend

### Públicas
- Home, Login, ForgotPassword, ResetPassword, VerifyEmail
- BlogPage, EventsPage, GalleryPage, PrayerPage (pública)
- VolunteeringPage, AboutPage, DonatePage, PaymentSuccess, ProfilePage

### Admin
- Dashboard, AdminUsers, AdminBlog, AdminEvents, AdminPetitions
- AdminVolunteers, AdminCellReports, AdminBoletas, AdminSocial
- AdminAnnouncements, AdminGallery, AdminActivityLog

### Líder
- LeaderIndex, LeaderReports, LeaderBoletas, LeaderVolunteers, LeaderCellDirectory

---

## Roles del sistema

| Rol | Acceso |
|---|---|
| `admin` | Todo el panel de administración |
| `leader` | Reportes célula, boletas, directorio de miembros |
| `volunteer` | Solo perfil y metas personales |
| `member` | Perfil y metas personales |

---

## Pagos implementados

- **PayPal** completo: create order → redirect → capture
- **Donación local manual**: transferencia, Tigo Money, presencial
- **Sin Stripe** (nunca se implementó)

---

## Paleta de colores actual

Usa **Material Design 3** con CSS variables + Tailwind custom tokens.

- Color primario de hero: `#0A1145` (azul muy oscuro)
- Colores: se adaptan a modo oscuro/claro automáticamente
- No hay paleta fija de marca: azul marino / blanco / negro / celeste

---

## Exportaciones CSV (activas)

- `/admin/export/cell-reports` → CSV de reportes de célula
- `/admin/export/donations` → CSV de donaciones
- `/admin/export/boletas` → CSV de boletas de miembros

---

## Registro de usuarios

- Endpoint `POST /auth/register` existe pero está **desactivado** en el router
- Solo admins pueden crear cuentas desde el panel

---

## Departamentos de voluntarios (hardcoded)

Lista actual (a verificar en handler):
- Alabanza, Danza, Multimedia *(los únicos confirmados)*

---

## Peticiones de oración

- **Acceso público** — cualquier visitante puede enviar
- Sin generación de PDF
- Sin restricción de roles

---

## Tipos de célula

Almacenado como string libre en `cell_type` y `cell_code`.
No hay formato forzado ni validación de códigos (VX / MX / JX / PX / NX).
