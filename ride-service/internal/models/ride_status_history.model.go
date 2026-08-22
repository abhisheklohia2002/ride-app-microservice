package models

import "time"

type RideStatusHistory struct {
	ID uint64 `gorm:"primaryKey"`

	RideID uint64 `gorm:"not null;index"`

	FromStatus string `gorm:"not null"`
	ToStatus   string `gorm:"not null"`

	ChangedBy string `gorm:"not null"`

	CreatedAt time.Time
}
