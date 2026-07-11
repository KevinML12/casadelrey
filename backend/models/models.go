package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name                    string     `json:"name" gorm:"not null"`
	Email                   string     `json:"email" gorm:"unique;not null"`
	Password                string     `json:"-" gorm:"not null"`
	Role                    string     `json:"role" gorm:"default:member"` // admin|leader|volunteer|member
	Address                 string     `json:"address"`
	Phone                   string     `json:"phone" gorm:"type:varchar(30)"`
	// Célula — normalizada
	CellID                  *uint      `json:"cell_id" gorm:"index"`      // FK → Cell (nuevo)
	CellCode                string     `json:"cell_code"`                 // deprecar tras migración
	CellType                string     `json:"cell_type"`                 // deprecar tras migración
	// Auth
	ResetToken              *string    `json:"-" gorm:"index"`
	ResetTokenExpiry        *time.Time `json:"-"`
	EmailVerified           bool       `json:"email_verified" gorm:"default:false"`
	VerificationToken       *string    `json:"-" gorm:"index"`
	VerificationTokenExpiry *time.Time `json:"-"`
}

// Cell normaliza las células. Evita repetir código/nombre/tipo en cada reporte.
type Cell struct {
	gorm.Model
	Code     string `json:"code" gorm:"type:varchar(10);unique;not null"` // H1, M2, J3…
	Name     string `json:"name" gorm:"type:varchar(100);not null"`
	Type     string `json:"type" gorm:"type:varchar(20);not null"` // hombres|mujeres|jovenes|prejus|ninos
	LeaderID uint   `json:"leader_id" gorm:"index;not null"`
	PastorID *uint  `json:"pastor_id" gorm:"index"`
	Zone     string `json:"zone" gorm:"type:varchar(80)"` // zona/sector aproximado — lo ÚNICO de ubicación que va público
	IsActive bool   `json:"is_active" gorm:"default:true"`
	Leader   User   `json:"leader" gorm:"foreignKey:LeaderID"`
}

// CellCategory agrupa células por tipos (Adolescentes, Jóvenes, Varones, Mujeres, etc.)
type CellCategory struct {
	gorm.Model
	Name        string `json:"name" gorm:"type:varchar(100);not null;unique"` // e.g. "Adolescentes"
	AgeGroup    string `json:"age_group" gorm:"type:varchar(50)"`             // e.g. "15 a 24 años"
	Description string `json:"description" gorm:"type:text"`
	ImageURL    string `json:"image_url" gorm:"type:varchar(500)"`
	IsActive    bool   `json:"is_active" gorm:"default:true"`
}

// SitePhoto — fotos ambiente administrables por slot fijo (p.ej. los
// fondos de sección de la página Nosotros). El admin las reemplaza
// subiendo a R2; si un slot no tiene foto propia, el frontend cae al
// fallback local empacado en public/images/ (garantiza disponibilidad
// aunque R2 o la API fallen).
type SitePhoto struct {
	gorm.Model
	Key      string `json:"key" gorm:"type:varchar(60);unique;not null"` // slot fijo, ej. "about_pastores"
	Label    string `json:"label" gorm:"type:varchar(150)"`              // texto legible para el admin
	ImageURL string `json:"image_url" gorm:"type:varchar(500)"`
}

type Post struct {
	gorm.Model
	Title          string `json:"title" gorm:"not null"`
	Slug           string `json:"slug" gorm:"unique;not null"`
	Content        string `json:"content" gorm:"type:text"`
	CoverImage     string `json:"cover_image"`
	Excerpt        string `json:"excerpt" gorm:"type:text"`
	RedirectURL    string `json:"redirect_url" gorm:"type:varchar(500)"`
	SocialPlatform string `json:"social_platform" gorm:"type:varchar(20)"` // instagram|facebook|youtube|tiktok
	AuthorID       uint   `json:"author_id" gorm:"not null"`
	Status         string `json:"status" gorm:"default:draft"` // draft|published
	ViewCount      int64  `json:"view_count" gorm:"default:0"`
	Author         User   `json:"author" gorm:"foreignKey:AuthorID"`
}

type Petition struct {
	gorm.Model
	Name       string    `json:"name" gorm:"type:varchar(100);not null"`
	Email      string    `json:"email" gorm:"type:varchar(100);index"`
	Phone      string    `json:"phone" gorm:"type:varchar(20)"`
	Category   string    `json:"category" gorm:"type:varchar(50)"`
	Subject    string    `json:"subject" gorm:"type:varchar(255);not null"`
	Message    string    `json:"message" gorm:"type:text;not null"`
	IsAnswered bool      `json:"is_answered" gorm:"default:false"`
	AnsweredAt time.Time `json:"answered_at"`
	UserID     *uint     `json:"user_id" gorm:"index"` // líder/admin que envía
}

// ConnectCard — tarjeta de conexión: un visitante NUEVO se registra él
// mismo (formulario público, sin auth) y el equipo de seguimiento lo
// contacta. Distinto de MemberBoleta (que llena un LÍDER durante su
// reporte de célula) — ver DB_SCHEMA.md "connect_cards".
type ConnectCard struct {
	gorm.Model
	Name              string `json:"name" gorm:"type:varchar(100);not null"`
	Phone             string `json:"phone" gorm:"type:varchar(30)"`
	Email             string `json:"email" gorm:"type:varchar(100)"`
	HowFound          string `json:"how_found" gorm:"type:varchar(30)"`          // invitacion|redes|publicidad|otro
	Category          string `json:"category" gorm:"type:varchar(30);not null"` // primera_vez|reconciliado|busco_celula
	LeaderAssignedID  *uint  `json:"leader_assigned_id" gorm:"index"`
	LeaderAssigned    *User  `json:"leader_assigned,omitempty" gorm:"foreignKey:LeaderAssignedID"`
	Status            string `json:"status" gorm:"type:varchar(20);default:'nuevo'"` // nuevo|contactado|integrado
	Notes             string `json:"notes" gorm:"type:text"`
}

type Donation struct {
	gorm.Model
	Name             string  `json:"name" gorm:"type:varchar(100);not null"`
	Email            string  `json:"email" gorm:"type:varchar(100);index"`
	UserID           *uint   `json:"user_id" gorm:"index"` // si el donante es miembro
	Amount           float64 `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency         string  `json:"currency" gorm:"type:varchar(3);default:'GTQ'"`
	PaymentMethod    string  `json:"payment_method" gorm:"type:varchar(50)"` // transferencia|tigo_money|presencial
	PaymentReference string  `json:"payment_reference" gorm:"type:varchar(255)"`
	ReceiptURL       string  `json:"receipt_url" gorm:"type:varchar(500)"`
	ReceiptID        *uint   `json:"receipt_id" gorm:"index"` // FK → PaymentReceipt
	IsSuccessful     bool    `json:"is_successful" gorm:"default:true"`
	DonationPurpose  string  `json:"donation_purpose" gorm:"type:varchar(255)"`
}

// PaymentReceipt verifica comprobantes bancarios para cobros de eventos y donaciones.
type PaymentReceipt struct {
	gorm.Model
	PayerName        string     `json:"payer_name" gorm:"type:varchar(100);not null"`
	PayerEmail       string     `json:"payer_email" gorm:"type:varchar(100)"`
	PayerPhone       string     `json:"payer_phone" gorm:"type:varchar(30)"`
	Amount           float64    `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency         string     `json:"currency" gorm:"type:varchar(3);default:'GTQ'"`
	BankName         string     `json:"bank_name" gorm:"type:varchar(100)"`     // Banrural|BAC|G&T|Industrial
	ReferenceNumber  string     `json:"reference_number" gorm:"type:varchar(255)"`
	ReceiptImageURL  string     `json:"receipt_image_url" gorm:"type:varchar(500)"` // Cloudflare R2
	Purpose          string     `json:"purpose" gorm:"type:varchar(50)"`           // evento|donacion
	EventID          *uint      `json:"event_id" gorm:"index"`
	DonationID       *uint      `json:"donation_id" gorm:"index"`
	Status           string     `json:"status" gorm:"type:varchar(20);default:pendiente"` // pendiente|verificado|rechazado
	VerifiedByID     *uint      `json:"verified_by_id" gorm:"index"`
	VerifiedAt       *time.Time `json:"verified_at"`
	RejectionReason  string     `json:"rejection_reason" gorm:"type:varchar(255)"`
}

type Event struct {
	gorm.Model
	Title           string  `json:"title" gorm:"type:varchar(255);not null"`
	Date            string  `json:"date" gorm:"type:varchar(20)"`
	Time            string  `json:"time" gorm:"type:varchar(10)"`   // "10:00"
	Location        string  `json:"location" gorm:"type:varchar(255)"`
	Description     string  `json:"description" gorm:"type:text"`
	CoverImage      string  `json:"cover_image" gorm:"type:varchar(500)"`
	IsActive        bool    `json:"is_active" gorm:"default:true"`
	RequiresPayment bool    `json:"requires_payment" gorm:"default:false"`
	PriceGTQ        float64 `json:"price_gtq" gorm:"type:decimal(10,2);default:0"`
	PaymentDeadline string  `json:"payment_deadline" gorm:"type:varchar(20)"`
}

type CellReport struct {
	gorm.Model
	// Identificación
	CellID      *uint  `json:"cell_id" gorm:"index"`                         // FK → Cell (nuevo)
	CellCode    string `json:"cell_code" gorm:"type:varchar(20)"`
	CellName    string `json:"cell_name" gorm:"type:varchar(100);not null"`
	CellType    string `json:"cell_type" gorm:"type:varchar(20)"`
	MeetingDate string `json:"meeting_date" gorm:"type:varchar(20);not null"`
	// Responsables
	LeaderID   *uint  `json:"leader_id" gorm:"index"`
	LeaderName string `json:"leader_name" gorm:"type:varchar(100)"`  // deprecar
	PastorID   *uint  `json:"pastor_id" gorm:"index"`                // nuevo
	PastorName string `json:"pastor_name" gorm:"type:varchar(100)"`  // deprecar
	// Anfitrión
	HostName  string `json:"host_name" gorm:"type:varchar(100)"`
	HostPhone string `json:"host_phone" gorm:"type:varchar(30)"`
	Address   string `json:"address" gorm:"type:varchar(255)"`
	// Contenido
	Topic  string `json:"topic" gorm:"type:varchar(255)"`
	Notes  string `json:"notes" gorm:"type:text"`
	// Números
	TotalAttendees int     `json:"total_attendees" gorm:"default:0"`
	Converts       int     `json:"converts" gorm:"default:0"`
	Reconciled     int     `json:"reconciled" gorm:"default:0"`
	NewMembers     int     `json:"new_members" gorm:"default:0"`
	Offering       float64 `json:"offering" gorm:"type:decimal(10,2);default:0"`
	// Media
	PhotoURL string `json:"photo_url" gorm:"type:varchar(500)"`
	// Aprobación
	Status       string     `json:"status" gorm:"type:varchar(20);default:pendiente"` // pendiente|aprobado|rechazado
	ApprovedByID *uint      `json:"approved_by_id" gorm:"index"`
	ApprovedAt   *time.Time `json:"approved_at"`
}

type UserGoal struct {
	gorm.Model
	UserID      uint       `json:"user_id" gorm:"not null;index"`
	Title       string     `json:"title" gorm:"type:varchar(255);not null"`
	Description string     `json:"description" gorm:"type:text"`
	TargetDate  string     `json:"target_date" gorm:"type:varchar(20)"`
	Completed   bool       `json:"completed" gorm:"default:false"`
	CompletedAt *time.Time `json:"completed_at"`
}

type Volunteer struct {
	gorm.Model
	Name             string `json:"name" gorm:"type:varchar(100);not null"`
	Email            string `json:"email" gorm:"type:varchar(100);not null;index"`
	Phone            string `json:"phone" gorm:"type:varchar(30)"`
	Department       string `json:"department" gorm:"type:varchar(50)"`
	Message          string `json:"message" gorm:"type:text"`
	AssignedLeaderID *uint  `json:"assigned_leader_id" gorm:"index"`
	UserID           *uint  `json:"user_id" gorm:"index"` // FK al usuario creado
	Status           string `json:"status" gorm:"type:varchar(20);default:pendiente"` // pendiente|asignado|coordinando|usuario_creado
}

type SocialPost struct {
	gorm.Model
	Platform     string `json:"platform" gorm:"type:varchar(20);not null"` // facebook|instagram|youtube|tiktok
	PostURL      string `json:"post_url" gorm:"type:varchar(500);not null"`
	Caption      string `json:"caption" gorm:"type:varchar(500)"`
	ImageURL     string `json:"image_url" gorm:"type:varchar(500)"`        // foto subida a R2
	FeaturedSize string `json:"featured_size" gorm:"type:varchar(20);default:'medium'"` // small|medium|large — grid editorial
	IsActive     bool   `json:"is_active" gorm:"default:true"`
	SortOrder    int    `json:"sort_order" gorm:"default:0"`
}

type Announcement struct {
	gorm.Model
	Title       string     `json:"title" gorm:"type:varchar(255);not null"`
	Content     string     `json:"content" gorm:"type:text;not null"`
	RoleTarget  string     `json:"role_target" gorm:"type:varchar(20);default:all"` // all|member|leader|volunteer|admin
	IsActive    bool       `json:"is_active" gorm:"default:true"`
	PublishedAt *time.Time `json:"published_at"`
	ExpiresAt   *time.Time `json:"expires_at"` // auto-desaparece
	CreatedByID uint       `json:"created_by_id" gorm:"index"`
	Author      User       `json:"author" gorm:"foreignKey:CreatedByID"`
}

type EventRegistration struct {
	gorm.Model
	EventID         uint   `json:"event_id" gorm:"not null;index"`
	Event           Event  `json:"event" gorm:"foreignKey:EventID"`
	UserID          *uint  `json:"user_id" gorm:"index"`
	Name            string `json:"name" gorm:"type:varchar(100);not null"`
	Email           string `json:"email" gorm:"type:varchar(100);not null"`
	Phone           string `json:"phone" gorm:"type:varchar(30)"`
	AttendeeCount   int    `json:"attendee_count" gorm:"default:1"`
	Notes           string `json:"notes" gorm:"type:text"`
	PaymentStatus   string `json:"payment_status" gorm:"type:varchar(20);default:no_requerido"` // no_requerido|pendiente|verificado|rechazado
	ReceiptID       *uint  `json:"receipt_id" gorm:"index"` // FK → PaymentReceipt
}

type GalleryPhoto struct {
	gorm.Model
	Title        string `json:"title" gorm:"type:varchar(255)"`
	Description  string `json:"description" gorm:"type:text"`
	URL          string `json:"url" gorm:"type:varchar(500);not null"`
	ThumbnailURL string `json:"thumbnail_url" gorm:"type:varchar(500)"`
	EventID      *uint  `json:"event_id" gorm:"index"`
	UploadedByID uint   `json:"uploaded_by_id" gorm:"index"`
	IsActive     bool   `json:"is_active" gorm:"default:true"`
	SortOrder    int    `json:"sort_order" gorm:"default:0"`
}

type ActivityLog struct {
	gorm.Model
	UserID     uint   `json:"user_id" gorm:"index"`
	UserName   string `json:"user_name" gorm:"type:varchar(100)"`
	Action     string `json:"action" gorm:"type:varchar(50);not null"`
	Resource   string `json:"resource" gorm:"type:varchar(50);not null"`
	ResourceID uint   `json:"resource_id"`
	Details    string `json:"details" gorm:"type:text"`
	IPAddress  string `json:"ip_address" gorm:"type:varchar(45)"`
}

// HeroSetting configura el contenido del hero de la home pública.
// Solo hay un registro activo a la vez. Editado desde /admin/hero.
type HeroSetting struct {
	gorm.Model
	// Textos
	LabelTop         string `json:"label_top" gorm:"type:varchar(120)"`     // "● IGLESIA CRISTIANA · HUEHUETENANGO"
	TitleLine1       string `json:"title_line_1" gorm:"type:varchar(80)"`   // "LUZ PARA"
	TitleLine2       string `json:"title_line_2" gorm:"type:varchar(80)"`   // "LAS NACIONES" (outline)
	VerseReference   string `json:"verse_reference" gorm:"type:varchar(40)"` // "MATEO 5:14"
	Subtitle         string `json:"subtitle" gorm:"type:varchar(200)"`      // "Empieza tu propósito aquí."
	ScheduleText     string `json:"schedule_text" gorm:"type:varchar(200)"` // "Domingos · 10am · Zona 1, Huehuetenango"

	// CTAs
	CTAPrimaryText   string `json:"cta_primary_text" gorm:"type:varchar(60)"`
	CTAPrimaryURL    string `json:"cta_primary_url" gorm:"type:varchar(255)"`
	CTASecondaryText string `json:"cta_secondary_text" gorm:"type:varchar(60)"`
	CTASecondaryURL  string `json:"cta_secondary_url" gorm:"type:varchar(255)"`

	// Visual
	BackgroundImageURL string `json:"background_image_url" gorm:"type:varchar(500)"`
	OverlayColor       string `json:"overlay_color" gorm:"type:varchar(20);default:'#060D24'"`
	OverlayOpacity     int    `json:"overlay_opacity" gorm:"default:50"` // 0-100

	// Estado
	IsActive bool `json:"is_active" gorm:"default:false"`
}

type MemberBoleta struct {
	gorm.Model
	Date           string `json:"date" gorm:"type:varchar(20);not null"`
	InviterName    string `json:"inviter_name" gorm:"type:varchar(100)"`
	InviterPhone   string `json:"inviter_phone" gorm:"type:varchar(30)"`
	InviterUserID  *uint  `json:"inviter_user_id" gorm:"index"` // si el invitador es miembro
	GuestName      string `json:"guest_name" gorm:"type:varchar(100);not null"`
	GuestPhone     string `json:"guest_phone" gorm:"type:varchar(30)"`
	Address        string `json:"address" gorm:"type:varchar(255)"`
	Category       string `json:"category" gorm:"type:varchar(30);not null"` // reconciliado|convertido|nuevo
	LeaderID       *uint  `json:"leader_id" gorm:"index"`
	CellReportID   *uint  `json:"cell_report_id" gorm:"index"`
	Notes          string `json:"notes" gorm:"type:text"`
}

type FAQ struct {
	gorm.Model
	Question  string `json:"question" gorm:"type:text;not null"`
	Answer    string `json:"answer" gorm:"type:text;not null"`
	IsActive  bool   `json:"is_active" gorm:"default:true"`
	SortOrder int    `json:"sort_order" gorm:"default:0"`
}
