# Handoff — Casa del Rey

> Documento de continuidad para retomar el proyecto en una nueva sesión.
> Pega esto al inicio de la conversación nueva para que Claude entre en contexto.

---

## Para Claude en la nueva conversación

Hola Claude. Estoy trabajando en **Casa del Rey** — plataforma de gestión para una iglesia cristiana en Huehuetenango, Guatemala. Necesito continuar el desarrollo. Lee este handoff completo antes de hacer nada.

---

## 🎯 Stack y deploy

| Capa | Tech | URL |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind 3 | https://casadelreyhue.vercel.app |
| Backend | Go 1.24 + Echo v4 + GORM | https://casa-del-rey-mvp.fly.dev |
| Base de datos | PostgreSQL en Supabase (us-east-2) | — |
| Storage | Cloudflare R2 (cuenta dev Kevin) | `casadelreyhue-dev` bucket |
| Deploy | Auto Vercel + `fly deploy` | — |

**Credenciales de prueba:**
```
Admin:      pastor@casadelrey.org   / Admin2026!
Líder:      leonel@casadelrey.org   / Lider2026!
Voluntario: juan.v@casadelrey.org   / Vol2026!
```

---

## ✅ Lo que está IMPLEMENTADO

### Backend (en producción Fly.io)
- 16 modelos con esquema normalizado (`backend/models/models.go`)
- Auth JWT propio con email verification
- Hero CMS dinámico (`/admin/hero`)
- Verificación de comprobantes bancarios (`payment_receipts`)
- Bloqueo de RSVP sin boleta en eventos de pago
- Doble confirmación + revertir en comprobantes
- PDF semanal de oraciones
- Selector VX/MX/JX/PX/NX para códigos de célula
- Dashboard voluntario
- Notificaciones con badges
- Storage abstracto R2/local con failover

### Frontend (Vercel)
- Sitio público: Home, Blog, Eventos (con cobros), Galería, Voluntarios, Comprobante, Donate
- Panel Admin completo: Users, Blog, Events, Hero, Petitions, Volunteers, CellReports, Boletas, Receipts, Gallery, Social, Announcements, ActivityLog
- Panel Líder: Index, Reports, Boletas, Volunteers, CellDirectory
- Panel Voluntario: Dashboard
- Login con redirect por rol
- Oración restringida a líderes/admins
- `CellCodePicker` componente reutilizable

### Brand System (recién implementado)
- **Paleta final:** Navy `#0D1B4B` + Turquesa `#4AD0CE` + Violeta `#7C3AED` + Cream `#FAFAF8`
- Variables CSS en `frontend/src/index.css`
- Tokens Tailwind en `frontend/tailwind.config.js`
- Easings Apple HIG + animaciones hero stagger
- Sombras Apple sutiles (elev-1 a elev-5)
- Botones `.btn-pill` + `.nav-sticky` con backdrop blur
- Soporte dark + light mode

---

## 🔄 Lo que está EN PROCESO

### Pencil — Brand Style Guide
Ya generó el **frame completo del Brand Style Guide** con:
- Hero "LUZ PARA LAS NACIONES" dramático
- Sección "Casa del Rey × Apple Patterns" con nav, hero "Eventos.", familia células, cards, botones pill, search modal, footer
- Voz y tono comparativo
- Cierre editorial

### Próximo paso: refactor componente por componente
Hay **12 prompts atómicos listos** en `PROMPTS_PENCIL_COMPONENTES.md` para que Pencil regenere cada componente con la nueva paleta. Orden de impacto:

1. 🔥 Hero Home (Sonnet High)
2. Nav superior
3. Footer
4. Card evento
5. Card blog
6. Botones
7. Inputs/formularios
8. Chips estado
9. Modal
10. Sidebar admin
11. Login
12. Empty states / Loading

---

## ❌ Lo que FALTA (priorizado)

### Refactor visual con la nueva paleta
- [ ] Implementar mockups de Pencil a código React (componente por componente)
- [ ] Reemplazar nav actual con el patrón Apple sticky 44px
- [ ] Crear Footer Apple-style multi-columna
- [ ] Actualizar `EventsPage` y `BlogPage` con el hero pattern Apple
- [ ] Refactorizar sidebar admin/líder con nuevo styling
- [ ] Login split 50/50 con cita bíblica

### Features pendientes de los requerimientos originales
- [ ] **Cobros locales con tarjeta** — esperando datos del procesador bancario del cliente
- [ ] Tarjeta de conexión pública para visitantes nuevos
- [ ] Archivo de sermones (embed YouTube)
- [ ] Horarios de culto visibles en home (puede salir del Hero CMS)
- [ ] SEO + meta tags + Open Graph
- [ ] Email automático de bienvenida
- [ ] Compresión de imágenes antes de upload

---

## 📁 Archivos clave del repo

### Documentación
| Archivo | Contiene |
|---|---|
| `HANDOFF.md` | **Este archivo** — punto de entrada |
| `DB_SCHEMA.md` | Esquema BD normalizado |
| `SCHEMA_ERD.md` | ERD en Mermaid |
| `PLAN_IMPLEMENTACION.md` | Plan por fases |
| `DESIGN_LOGIC.md` | Spec funcional de UI |
| `PROMPT_PENCIL_STYLE_GUIDE_V2.md` | Prompt master del Style Guide |
| `PROMPT_PENCIL_APPLE_PATTERNS.md` | Patrones Apple aplicados |
| `PROMPTS_PENCIL_COMPONENTES.md` | **12 prompts atómicos para refactor** |

### Código
| Archivo | Contiene |
|---|---|
| `backend/models/models.go` | 16 modelos GORM |
| `backend/routes/routes.go` | Todas las rutas API |
| `backend/storage/storage.go` | Abstracción R2/local |
| `backend/handlers/hero.handler.go` | Hero CMS endpoints |
| `backend/handlers/payment_receipt.handler.go` | Verificación comprobantes |
| `frontend/src/index.css` | **Brand system completo CSS** |
| `frontend/tailwind.config.js` | **Tokens Tailwind** |
| `frontend/src/pages/admin/AdminHero.jsx` | Editor del Hero CMS |

---

## 🛠 Comandos útiles

```bash
# Deploy backend
cd backend && fly deploy

# Build frontend local (Vercel auto-deploya en push)
cd frontend && npm run build

# Seed datos de prueba
cd backend && go run ./cmd/seed/main.go

# Push a producción
git add -A && git commit -m "..." && git push origin main
```

---

## 🎨 Paleta final (Pencil-extracted)

```css
--navy:        #0D1B4B  /* primario */
--navy-press:  #091237
--navy-deep:   #060D24  /* hero/footer dark */
--turquesa:    #4AD0CE  /* acento principal */
--violeta:     #7C3AED  /* acento juvenil opcional */
--cream:       #FAFAF8  /* fondo claro */
--tinta:       #050505  /* texto */
--texto-sec:   #525B7A
--borde:       #E5E7EB

--ok:          #10B981
--err:         #EF4444
--warn:        #F59E0B
```

---

## 💼 Contexto de negocio

- **Cliente:** Pastor Roberto Méndez (admin) + Carlos Méndez (admin secundario)
- **Audiencia:** Jóvenes 16-35 + familias guatemaltecas
- **Personalidad:** Moderna, accesible, dramática pero limpia
- **Inspiración:** Elevation Church + Apple HIG
- **NO:** PostHog, Material Design genérico, SaaS landing pages
- **Pago del proyecto:** $2.5k → para comprar Dior Homme Sport 😎

---

## 🚀 Cómo continuar

**Opción A — Refactor visual:**
1. Tomar el Prompt 1 de `PROMPTS_PENCIL_COMPONENTES.md`
2. Ejecutar en Pencil (Sonnet 4.6 High solo para Hero)
3. Pasar screenshot a Claude
4. Claude implementa el componente en código React

**Opción B — Features funcionales:**
1. Tarjeta de conexión pública
2. SEO básico
3. Email de bienvenida
4. Compresión de imágenes

**Opción C — Esperando cliente:**
1. Cobros locales con tarjeta (requiere datos del banco GT)

---

**Última sesión:** brand system implementado en código, 12 prompts atómicos listos para refactor. Backend y frontend en producción funcionando.
