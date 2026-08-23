package repository

import (
	"context"

	"github.com/ride-service/internal/models"
	"gorm.io/gorm"
)

type Repository interface {
	CreateRide(
		ctx context.Context,
		req models.Ride,
	) (*models.Ride, error)
}

type repositoryImpl struct {
	db *gorm.DB
}

func NewRepository(
	db *gorm.DB,
) Repository {
	return &repositoryImpl{
		db: db,
	}
}

func (r repositoryImpl) CreateRide(
	ctx context.Context,
	req models.Ride,
) (*models.Ride, error) {

	if err := r.db.WithContext(ctx).
		Create(&req).
		Error; err != nil {
		return nil, err
	}

	return &req, nil
}
