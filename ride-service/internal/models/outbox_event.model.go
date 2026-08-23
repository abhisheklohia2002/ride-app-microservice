package models

import "time"

type OutboxEvent struct {
	ID uint64 `gorm:"primaryKey"`

	EventType string `gorm:"not null;index"`

	AggregateType string `gorm:"not null;index"`

	AggregateID uint64 `gorm:"not null;index"`

	Payload string `gorm:"type:jsonb;not null"`

	Status string `gorm:"not null;default:PENDING;index"`

	RetryCount int `gorm:"not null;default:0"`

	PublishedAt *time.Time

	CreatedAt time.Time
	UpdatedAt time.Time
}