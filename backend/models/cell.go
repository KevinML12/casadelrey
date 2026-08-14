package models

import (
	"time"

	"gorm.io/gorm"
)

// Cell normaliza las células. Evita repetir código/nombre/tipo en cada reporte.
type Cell struct {
	gorm.Model
	Code        string `json:"code" gorm:"type:varchar(10);unique;not null"` // H1, M2, J3…
	Name        string `json:"name" gorm:"type:varchar(100);not null"`
	Type        string `json:"type" gorm:"type:varchar(20);not null"` // hombres|mujeres|jovenes|prejus|ninos
	Description string `json:"description" gorm:"type:text"`
	LeaderID    uint   `json:"leader_id" gorm:"index;not null"`
	PastorID    *uint  `json:"pastor_id" gorm:"index"`
	Zone        string `json:"zone" gorm:"type:varchar(80)"` // zona/sector aproximado — lo ÚNICO de ubicación que va público
	IsActive    bool   `json:"is_active" gorm:"default:true"`
	Leader      User   `json:"leader" gorm:"foreignKey:LeaderID"`

	// ── Lo que un visitante pregunta antes de presentarse (ago-2026) ──
	Day  string `json:"day" gorm:"type:varchar(40)"`  // "Martes", "Cada 15 días"…
	Time string `json:"time" gorm:"type:varchar(30)"` // "7:00 PM"

	// WhatToExpect: qué pasa en una reunión.
	WhatToExpect string `json:"what_to_expect" gorm:"type:text"`
}

// CellCategory agrupa células por tipos (Adolescentes, Jóvenes, Varones, Mujeres, etc.)
type CellCategory struct {
	gorm.Model
	Name        string `json:"name" gorm:"type:varchar(100);not null;unique"` // e.g. "Adolescentes"
	AgeGroup    string `json:"age_group" gorm:"type:varchar(50)"`             // e.g. "15 a 24 años"
	Description string `json:"description" gorm:"type:text"`
	ImageURL    string `json:"image_url" gorm:"type:varchar(500)"`
	TypeKey     string `json:"type_key" gorm:"type:varchar(20)"` // hombres|mujeres|jovenes|prejus|ninos|""
	SortOrder   int    `json:"sort_order" gorm:"default:0"`
	IsActive    bool   `json:"is_active" gorm:"default:true"`
}

type CellReport struct {
	gorm.Model
	// Identificación
	CellID      *uint  `json:"cell_id" gorm:"index"` // FK → Cell (nuevo)
	CellCode    string `json:"cell_code" gorm:"type:varchar(20)"`
	CellName    string `json:"cell_name" gorm:"type:varchar(100);not null"`
	CellType    string `json:"cell_type" gorm:"type:varchar(20)"`
	MeetingDate string `json:"meeting_date" gorm:"type:varchar(20);not null"`
	// Responsables
	LeaderID   *uint  `json:"leader_id" gorm:"index"`
	LeaderName string `json:"leader_name" gorm:"type:varchar(100)"` // deprecar
	PastorID   *uint  `json:"pastor_id" gorm:"index"`               // nuevo
	PastorName string `json:"pastor_name" gorm:"type:varchar(100)"` // deprecar
	// Anfitrión
	HostName  string `json:"host_name" gorm:"type:varchar(100)"`
	HostPhone string `json:"host_phone" gorm:"type:varchar(30)"`
	Address   string `json:"address" gorm:"type:varchar(255)"`
	// Contenido
	Topic string `json:"topic" gorm:"type:varchar(255)"`
	Notes string `json:"notes" gorm:"type:text"`
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

type MemberBoleta struct {
	gorm.Model
	Date          string `json:"date" gorm:"type:varchar(20);not null"`
	InviterName   string `json:"inviter_name" gorm:"type:varchar(100)"`
	InviterPhone  string `json:"inviter_phone" gorm:"type:varchar(30)"`
	InviterUserID *uint  `json:"inviter_user_id" gorm:"index"` // si el invitador es miembro
	GuestName     string `json:"guest_name" gorm:"type:varchar(100);not null"`
	GuestPhone    string `json:"guest_phone" gorm:"type:varchar(30)"`
	Address       string `json:"address" gorm:"type:varchar(255)"`
	Category      string `json:"category" gorm:"type:varchar(30);not null"` // reconciliado|convertido|nuevo
	LeaderID      *uint  `json:"leader_id" gorm:"index"`
	CellReportID  *uint  `json:"cell_report_id" gorm:"index"`
	Notes         string `json:"notes" gorm:"type:text"`
}
