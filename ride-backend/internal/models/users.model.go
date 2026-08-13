package models

import "time"

type User struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	FullName      string         `json:"full_name" gorm:"not null"`
	Email         string         `json:"email" gorm:"uniqueIndex;not null"`
	Role          string         `json:"role" gorm:"not null;default:user"`
	PasswordHash  string         `json:"-" gorm:"not null"`
	RefreshTokens []RefreshToken `json:"refresh_tokens,omitempty" gorm:"foreignKey:UserID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
