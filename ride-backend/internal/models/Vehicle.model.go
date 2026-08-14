package models

import "time"

type Vehicle struct {
	ID          uint   `json:"id" gorm:"primaryKey"`
	FullName    string `json:"full_name" gorm:"not null"`
	PlateNumber string `json:"plate_number" gorm:"not null;uniqueIndex"`

	DriverID uint    `json:"driver_id" gorm:"not null;index"`
	Driver   *Driver `json:"driver,omitempty" gorm:"foreignKey:DriverID"`

	Status string `json:"status" gorm:"not null;default:inactive"`

	Bookings []Booking `json:"bookings,omitempty" gorm:"foreignKey:VehicleID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
