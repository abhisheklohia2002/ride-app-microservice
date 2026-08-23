package repository

import (
	"errors"

	"github.com/ride-app/ride-driver-service/internal/models"
	"gorm.io/gorm"
)

type RefreshTokenRepository interface {
	Create(token *models.RefreshToken) error
	FindByToken(token string) (*models.RefreshToken, error)
	Revoke(token string) error
	DeleteExpired() error
	DeleteTokensByUserID(userId uint) error
}

type RefreshTokenRepositoryImpl struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) RefreshTokenRepository {
	return &RefreshTokenRepositoryImpl{
		db: db,
	}
}

func (r *RefreshTokenRepositoryImpl) Create(token *models.RefreshToken) error {
	return r.db.Create(token).Error
}

func (r *RefreshTokenRepositoryImpl) FindByToken(token string) (*models.RefreshToken, error) {
	var refreshToken models.RefreshToken

	err := r.db.
		Where("token = ?", token).
		First(&refreshToken).
		Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}

		return nil, err
	}

	return &refreshToken, nil
}

func (r *RefreshTokenRepositoryImpl) Revoke(token string) error {
	return r.db.
		Model(&models.RefreshToken{}).
		Where("token = ?", token).
		Update("revoked_at", gorm.Expr("NOW()")).
		Error
}

func (r *RefreshTokenRepositoryImpl) DeleteExpired() error {
	return r.db.
		Where("expires_at < NOW()").
		Delete(&models.RefreshToken{}).
		Error
}

func (r *RefreshTokenRepositoryImpl) DeleteTokensByUserID(userID uint) error {
	return r.db.
		Where("user_id = ?", userID).
		Delete(&models.RefreshToken{}).Error
}
