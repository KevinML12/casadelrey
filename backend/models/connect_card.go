package models

import (
	"gorm.io/gorm"
)

type ConnectCard struct {
	gorm.Model
	Name             string `json:"name" gorm:"type:varchar(100);not null"`
	Phone            string `json:"phone" gorm:"type:varchar(30)"`
	Email            string `json:"email" gorm:"type:varchar(100)"`
	HowFound         string `json:"how_found" gorm:"type:varchar(30)"`         // invitacion|redes|publicidad|otro
	Category         string `json:"category" gorm:"type:varchar(30);not null"` // primera_vez|reconciliado|busco_celula
	LeaderAssignedID *uint  `json:"leader_assigned_id" gorm:"index"`
	LeaderAssigned   *User  `json:"leader_assigned,omitempty" gorm:"foreignKey:LeaderAssignedID"`
	Status           string `json:"status" gorm:"type:varchar(20);default:'nuevo'"` // nuevo|contactado|integrado
	Notes            string `json:"notes" gorm:"type:text"`
	Message          string `json:"message" gorm:"type:text"`
	CellID           *uint  `json:"cell_id" gorm:"index"`
	Cell             *Cell  `json:"cell,omitempty" gorm:"foreignKey:CellID"`
}
