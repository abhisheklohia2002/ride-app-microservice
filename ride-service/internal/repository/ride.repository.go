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

	CreateRideStatusHistory(
		ctx context.Context,
		tx *gorm.DB,
		history models.RideStatusHistory,
	) error

	GetRideByID(
		ctx context.Context,
		tx *gorm.DB,
		id uint64,
	) (*models.Ride, error)

	UpdateRideStatus(
		ctx context.Context,
		tx *gorm.DB,
		rideID uint64,
		status string,
	) error
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

func (r repositoryImpl) CreateRideStatusHistory(
	ctx context.Context,
	tx *gorm.DB,
	history models.RideStatusHistory,
) error {
	return tx.WithContext(ctx).
		Create(&history).
		Error
}

func (r repositoryImpl) GetRideByID(
	ctx context.Context,
	tx *gorm.DB,
	id uint64,
) (*models.Ride, error) {

	var ride models.Ride

	if err := tx.WithContext(ctx).
		First(&ride, id).
		Error; err != nil {
		return nil, err
	}

	return &ride, nil
}

func (r repositoryImpl) UpdateRideStatus(
	ctx context.Context,
	tx *gorm.DB,
	rideID uint64,
	status string,
) error {

	return tx.WithContext(ctx).
		Model(&models.Ride{}).
		Where("id = ?", rideID).
		Update("status", status).
		Error
}
