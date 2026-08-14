package models

import (
	"gorm.io/gorm"
)

type SitePhoto struct {
	gorm.Model
	Key      string `json:"key" gorm:"type:varchar(60);unique;not null"`
	Label    string `json:"label" gorm:"type:varchar(150)"`
	ImageURL string `json:"image_url" gorm:"type:varchar(500)"`
}

type SiteSetting struct {
	gorm.Model
	Key   string `json:"key" gorm:"type:varchar(60);unique;not null"`
	Value string `json:"value" gorm:"type:varchar(300)"`
}

type HeroSetting struct {
	gorm.Model
	LabelTop           string `json:"label_top" gorm:"type:varchar(120)"`
	TitleLine1         string `json:"title_line_1" gorm:"type:varchar(80)"`
	TitleLine2         string `json:"title_line_2" gorm:"type:varchar(80)"`
	VerseReference     string `json:"verse_reference" gorm:"type:varchar(40)"`
	Subtitle           string `json:"subtitle" gorm:"type:varchar(200)"`
	ScheduleText       string `json:"schedule_text" gorm:"type:varchar(200)"`
	CTAPrimaryText     string `json:"cta_primary_text" gorm:"type:varchar(60)"`
	CTAPrimaryURL      string `json:"cta_primary_url" gorm:"type:varchar(255)"`
	CTASecondaryText   string `json:"cta_secondary_text" gorm:"type:varchar(60)"`
	CTASecondaryURL    string `json:"cta_secondary_url" gorm:"type:varchar(255)"`
	BackgroundImageURL string `json:"background_image_url" gorm:"type:varchar(500)"`
	OverlayColor       string `json:"overlay_color" gorm:"type:varchar(20);default:'#060D24'"`
	OverlayOpacity     int    `json:"overlay_opacity" gorm:"default:50"`
	IsActive           bool   `json:"is_active" gorm:"default:false"`
}

type FAQ struct {
	gorm.Model
	Question  string `json:"question" gorm:"type:text;not null"`
	Answer    string `json:"answer" gorm:"type:text;not null"`
	IsActive  bool   `json:"is_active" gorm:"default:true"`
	SortOrder int    `json:"sort_order" gorm:"default:0"`
}
