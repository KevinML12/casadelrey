package models

import (
	"time"

	"gorm.io/gorm"
)

// User representa un usuario del sistema.
type User struct {
	gorm.Model
	Name                    string     `json:"name" gorm:"not null"`
	Email                   string     `json:"email" gorm:"unique;not null"`
	Password                string     `json:"-" gorm:"not null"`
	Role                    string     `json:"role" gorm:"default:member"` // member | leader | volunteer | admin
	Address                 string     `json:"address"`
	CellCode                string     `json:"cell_code"`  // código célula del líder (H1, M2, J3…)
	CellType                string     `json:"cell_type"`  // hombres | mujeres | jovenes | prejus | ninos
	ResetToken              *string    `json:"-" gorm:"index"`
	ResetTokenExpiry        *time.Time `json:"-"`
	EmailVerified           bool       `json:"email_verified" gorm:"default:false"`
	VerificationToken       *string    `json:"-" gorm:"index"`
	VerificationTokenExpiry *time.Time `json:"-"`
}

// Post representa una entrada del blog / enlace a red social.
type Post struct {
	gorm.Model
	Title       string `json:"title" gorm:"not null"`
	Slug        string `json:"slug" gorm:"unique;not null"`
	Content     string `json:"content" gorm:"type:text"`
	CoverImage  string `json:"cover_image"`
	Excerpt     string `json:"excerpt" gorm:"type:text"`
	RedirectURL string `json:"redirect_url" gorm:"type:varchar(500)"` // enlace a red social
	AuthorID    uint   `json:"author_id" gorm:"not null"`
	Status      string `json:"status" gorm:"default:draft"` // draft | published
	ViewCount   int64  `json:"view_count" gorm:"default:0"`
	Author      User   `json:"author" gorm:"foreignKey:AuthorID"`
}

// Petition representa una petición de oración.
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
}

// Donation representa una donación registrada localmente.
type Donation struct {
	gorm.Model
	Name             string  `json:"name" gorm:"type:varchar(100);not null"`
	Email            string  `json:"email" gorm:"type:varchar(100);index"`
	Amount           float64 `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency         string  `json:"currency" gorm:"type:varchar(3);default:'GTQ'"`
	PaymentMethod    string  `json:"payment_method" gorm:"type:varchar(50)"` // transferencia | tigo_money | presencial
	PaymentReference string  `json:"payment_reference" gorm:"type:varchar(255)"` // número de referencia bancaria
	ReceiptURL       string  `json:"receipt_url" gorm:"type:varchar(500)"`       // foto del comprobante
	IsSuccessful     bool    `json:"is_successful" gorm:"default:true"`
	DonationPurpose  string  `json:"donation_purpose" gorm:"type:varchar(255)"`
}

// Event representa un evento de la iglesia.
type Event struct {
	gorm.Model
	Title       string `json:"title" gorm:"type:varchar(255);not null"`
	Date        string `json:"date" gorm:"type:varchar(20)"`
	Location    string `json:"location" gorm:"type:varchar(255)"`
	Description string `json:"description" gorm:"type:text"`
	IsActive    bool   `json:"is_active" gorm:"default:true"`
}

// CellReport representa el reporte completo de una reunión de célula.
type CellReport struct {
	gorm.Model
	// Identificación
	CellCode    string `json:"cell_code" gorm:"type:varchar(20)"`            // H1, M2, J3…
	CellName    string `json:"cell_name" gorm:"type:varchar(100);not null"`  // nombre descriptivo
	CellType    string `json:"cell_type" gorm:"type:varchar(20)"`            // hombres | mujeres | jovenes | prejus | ninos
	MeetingDate string `json:"meeting_date" gorm:"type:varchar(20);not null"` // YYYY-MM-DD

	// Responsables
	LeaderID   *uint  `json:"leader_id" gorm:"index"`                     // FK a User
	LeaderName string `json:"leader_name" gorm:"type:varchar(100)"`        // nombre del líder
	PastorName string `json:"pastor_name" gorm:"type:varchar(100)"`        // pastor asignado

	// Anfitrión
	HostName  string `json:"host_name" gorm:"type:varchar(100)"`  // dueño de la casa
	HostPhone string `json:"host_phone" gorm:"type:varchar(30)"`
	Address   string `json:"address" gorm:"type:varchar(255)"`

	// Tema
	Topic string `json:"topic" gorm:"type:varchar(255)"` // tema de la reunión

	// Números
	TotalAttendees int     `json:"total_attendees" gorm:"default:0"`
	Converts       int     `json:"converts" gorm:"default:0"`       // convertidos (primera vez)
	Reconciled     int     `json:"reconciled" gorm:"default:0"`     // reconciliados (vuelven)
	NewMembers     int     `json:"new_members" gorm:"default:0"`    // nuevos = converts + reconciled
	Offering       float64 `json:"offering" gorm:"type:decimal(10,2);default:0"` // ofrenda en Q

	// Foto
	PhotoURL string `json:"photo_url" gorm:"type:varchar(500)"`

	// Notas
	Notes string `json:"notes" gorm:"type:text"`

	// Aprobación
	Status       string     `json:"status" gorm:"type:varchar(20);default:pendiente"` // pendiente | aprobado | rechazado
	ApprovedByID *uint      `json:"approved_by_id" gorm:"index"`
	ApprovedAt   *time.Time `json:"approved_at"`
}

// UserGoal representa una meta personal del usuario.
type UserGoal struct {
	gorm.Model
	UserID      uint   `json:"user_id" gorm:"not null;index"`
	Title       string `json:"title" gorm:"type:varchar(255);not null"`
	Description string `json:"description" gorm:"type:text"`
	TargetDate  string `json:"target_date" gorm:"type:varchar(20)"`
	Completed   bool   `json:"completed" gorm:"default:false"`
}

// Volunteer representa a un miembro que quiere unirse a un departamento.
type Volunteer struct {
	gorm.Model
	Name             string `json:"name" gorm:"type:varchar(100);not null"`
	Email            string `json:"email" gorm:"type:varchar(100);not null;index"`
	Phone            string `json:"phone" gorm:"type:varchar(30)"`
	Department       string `json:"department" gorm:"type:varchar(50)"` // ver DEPARTMENTS en handler
	Message          string `json:"message" gorm:"type:text"`
	AssignedLeaderID *uint  `json:"assigned_leader_id" gorm:"index"`
	Status           string `json:"status" gorm:"type:varchar(20);default:pendiente"` // pendiente | asignado | coordinando | usuario_creado
}

// SocialPost representa una publicación de FB/IG para mostrar en el feed.
type SocialPost struct {
	gorm.Model
	Platform  string `json:"platform" gorm:"type:varchar(20);not null"` // facebook | instagram
	PostURL   string `json:"post_url" gorm:"type:varchar(500);not null"`
	Caption   string `json:"caption" gorm:"type:varchar(500)"`
	ImageURL  string `json:"image_url" gorm:"type:varchar(500)"`
	IsActive  bool   `json:"is_active" gorm:"default:true"`
	SortOrder int    `json:"sort_order" gorm:"default:0"`
}

// MemberBoleta representa la ficha de registro de un nuevo miembro / visitante.
type MemberBoleta struct {
	gorm.Model
	Date         string `json:"date" gorm:"type:varchar(20);not null"`         // YYYY-MM-DD
	InviterName  string `json:"inviter_name" gorm:"type:varchar(100)"`         // quien lo invitó
	InviterPhone string `json:"inviter_phone" gorm:"type:varchar(30)"`
	GuestName    string `json:"guest_name" gorm:"type:varchar(100);not null"`  // el invitado
	GuestPhone   string `json:"guest_phone" gorm:"type:varchar(30)"`
	Address      string `json:"address" gorm:"type:varchar(255)"`
	Category     string `json:"category" gorm:"type:varchar(30);not null"` // reconciliado | convertido | nuevo
	LeaderID     *uint  `json:"leader_id" gorm:"index"`                    // líder que registra la boleta
	CellReportID *uint  `json:"cell_report_id" gorm:"index"`               // reporte de célula asociado
	Notes        string `json:"notes" gorm:"type:text"`
}
