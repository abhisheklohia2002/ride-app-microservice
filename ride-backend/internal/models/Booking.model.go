package models

import "time"

type Booking struct {
	ID uint `json:"id" gorm:"primaryKey"`

	UserID uint  `json:"user_id" gorm:"not null;index"`
	User   *User `json:"user,omitempty" gorm:"foreignKey:UserID"`

	DriverID *uint   `json:"driver_id,omitempty" gorm:"index"`
	Driver   *Driver `json:"driver,omitempty" gorm:"foreignKey:DriverID"`

	VehicleID *uint    `json:"vehicle_id,omitempty" gorm:"index"`
	Vehicle   *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`

	PickupLat     float64 `json:"pickup_lat" gorm:"type:decimal(10,7);not null"`
	PickupLng     float64 `json:"pickup_lng" gorm:"type:decimal(10,7);not null"`
	PickupAddress string  `json:"pickup_address" gorm:"type:text;not null"`

	DestinationLat     float64 `json:"destination_lat" gorm:"type:decimal(10,7);not null"`
	DestinationLng     float64 `json:"destination_lng" gorm:"type:decimal(10,7);not null"`
	DestinationAddress string  `json:"destination_address" gorm:"type:text;not null"`

	DistanceKm  float64 `json:"distance_km" gorm:"type:decimal(10,2)"`
	DurationMin int     `json:"duration_min"`

	RoutePolyline string `json:"route_polyline" gorm:"type:text"`

	Fare           float64 `json:"fare" gorm:"type:decimal(10,2);not null"`
	DiscountAmount float64 `json:"discount_amount" gorm:"type:decimal(10,2);default:0"`

	PromoCode string `json:"promo_code,omitempty" gorm:"type:varchar(100)"`

	Status string `json:"status" gorm:"type:varchar(50);not null;default:requested"`

	PaymentStatus string `json:"payment_status" gorm:"type:varchar(50);not null;default:pending"`

	CancellationReason string `json:"cancellation_reason,omitempty" gorm:"type:text"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	StartedAt   *time.Time `json:"started_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CancelledAt *time.Time `json:"cancelled_at,omitempty"`
}
