package models

import "time"

type Ride struct {
	ID uint64 `gorm:"primaryKey"`

	PassengerID uint64  `gorm:"not null;index"`
	DriverID    *uint64 `gorm:"index"`

	Status string `gorm:"not null;index"`

	PickupLatitude  float64 `gorm:"not null"`
	PickupLongitude float64 `gorm:"not null"`

	DropoffLatitude  float64 `gorm:"not null"`
	DropoffLongitude float64 `gorm:"not null"`

	EstimatedDistance float64
	EstimatedDuration int

	RequestedAt time.Time `gorm:"not null;index"`

	DriverAssignedAt *time.Time
	DriverArrivedAt  *time.Time
	StartedAt        *time.Time
	CompletedAt      *time.Time
	CancelledAt      *time.Time

	CreatedAt time.Time
	UpdatedAt time.Time
}
