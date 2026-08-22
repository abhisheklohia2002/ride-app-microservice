package models

import "time"

type Vehicle struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"not null;index"`
	FullName    string    `json:"full_name" gorm:"not null"`
	PlateNumber string    `json:"plate_number" gorm:"not null;uniqueIndex"`
	Status      bool      `json:"status" gorm:"not null;default:false"`
	User        User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
