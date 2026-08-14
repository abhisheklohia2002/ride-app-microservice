package models

import "time"

type Driver struct {
	ID uint `json:"id" gorm:"primaryKey"`

	UserID uint  `json:"user_id" gorm:"uniqueIndex;not null"`
	User   *User `json:"user,omitempty" gorm:"foreignKey:UserID"`

	Status string `json:"status" gorm:"not null;default:offline"`

	Vehicles []Vehicle `json:"vehicles,omitempty" gorm:"foreignKey:DriverID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
