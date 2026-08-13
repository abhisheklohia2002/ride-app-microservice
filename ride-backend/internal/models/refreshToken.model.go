package models

import "time"

type RefreshToken struct {
	ID        uint       `json:"id" gorm:"primaryKey"`
	Token     string     `json:"-" gorm:"not null;uniqueIndex"`
	UserID    uint       `json:"user_id" gorm:"not null;index"`
	ExpiresAt time.Time  `json:"expires_at" gorm:"not null;index"`
	RevokedAt *time.Time `json:"revoked_at"`

	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
