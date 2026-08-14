package models

import (
	"time"

	"gorm.io/gorm"
)

type Volunteer struct {
	gorm.Model
	Name             string `json:"name" gorm:"type:varchar(100);not null"`
	Email            string `json:"email" gorm:"type:varchar(100);not null;index"`
	Phone            string `json:"phone" gorm:"type:varchar(30)"`
	Department       string `json:"department" gorm:"type:varchar(50)"`
	Message          string `json:"message" gorm:"type:text"`
	AssignedLeaderID *uint  `json:"assigned_leader_id" gorm:"index"`
	UserID           *uint  `json:"user_id" gorm:"index"`                             // FK al usuario creado
	Status           string `json:"status" gorm:"type:varchar(20);default:pendiente"` // pendiente|asignado|coordinando|usuario_creado
}

type VolunteerReport struct {
	gorm.Model
	VolunteerID   *uint  `json:"volunteer_id" gorm:"index"`
	VolunteerName string `json:"volunteer_name" gorm:"type:varchar(100);not null"`
	Area          string `json:"area" gorm:"type:varchar(50);not null"`
	ServiceDate   string `json:"service_date" gorm:"type:varchar(20);not null"`
	LeaderName    string `json:"leader_name" gorm:"type:varchar(100)"`
	TeamAttendance int    `json:"team_attendance" gorm:"default:0"`
	Notes          string `json:"notes" gorm:"type:text"`
	PhotoURL       string `json:"photo_url" gorm:"type:varchar(500)"`
	Status       string     `json:"status" gorm:"type:varchar(20);default:pendiente"` // pendiente|aprobado|rechazado
	ApprovedByID *uint      `json:"approved_by_id" gorm:"index"`
	ApprovedAt   *time.Time `json:"approved_at"`
}

type VolunteerArea struct {
	gorm.Model
	Value             string `json:"value" gorm:"type:varchar(50);uniqueIndex;not null"` // alabanza, danza...
	Icon              string `json:"icon" gorm:"type:varchar(30)"`                       // nombre del icono del set ya existente (Glass.jsx)
	Title             string `json:"title" gorm:"type:varchar(100);not null"`
	Description       string `json:"description" gorm:"type:text"`
	Why               string `json:"why" gorm:"type:text"`                        // "por que aqui"
	Testimonial       string `json:"testimonial" gorm:"type:text"`                // cita real de un voluntario
	TestimonialAuthor string `json:"testimonial_author" gorm:"type:varchar(100)"` // "Nombre, rol/tiempo sirviendo"
	SortOrder         int    `json:"sort_order" gorm:"default:0"`
	IsActive          bool   `json:"is_active" gorm:"default:true"`
}
