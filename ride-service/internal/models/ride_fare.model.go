package models

import "time"

type RideFare struct {
	ID uint64 `gorm:"primaryKey"`

	RideID uint64 `gorm:"not null;uniqueIndex"`

	BaseFare     int64 `gorm:"not null"`
	DistanceFare int64 `gorm:"not null"`
	TimeFare     int64 `gorm:"not null"`

	SurgeMultiplier float64 `gorm:"not null;default:1"`

	Discount int64 `gorm:"not null;default:0"`

	EstimatedFare int64 `gorm:"not null"`
	FinalFare     *int64

	Currency string `gorm:"not null;default:INR"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
