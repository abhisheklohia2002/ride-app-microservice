package vehicles

import (
	"context"

	"github.com/ride-app/ride-driver-service/internal/models"
	"gorm.io/gorm"
)

type Vehicle interface {
	Create(ctx context.Context, vehicle *models.Vehicle) error
	GetAll(ctx context.Context) ([]models.Vehicle, error)
	GetByID(ctx context.Context, id uint) (*models.Vehicle, error)
	Update(ctx context.Context, vehicle *models.Vehicle) error
	Delete(ctx context.Context, id uint) error
}

type vehicleRepository struct {
	db *gorm.DB
}

func NewVehicleRepository(db *gorm.DB) Vehicle {
	return &vehicleRepository{db: db}
}

func (r *vehicleRepository) Create(
	ctx context.Context,
	v *models.Vehicle,
) error {

	return r.db.WithContext(ctx).Create(v).Error
}

func (r *vehicleRepository) GetAll(
	ctx context.Context,
) ([]models.Vehicle, error) {

	var vehicles []models.Vehicle

	err := r.db.
		WithContext(ctx).
		Find(&vehicles).
		Error

	return vehicles, err
}

func (r *vehicleRepository) GetByID(
	ctx context.Context,
	id uint,
) (*models.Vehicle, error) {

	var v models.Vehicle

	err := r.db.
		WithContext(ctx).
		First(&v, id).
		Error

	if err != nil {
		return nil, err
	}

	return &v, nil
}

func (r *vehicleRepository) Update(
	ctx context.Context,
	v *models.Vehicle,
) error {

	return r.db.
		WithContext(ctx).
		Save(v).
		Error
}

func (r *vehicleRepository) Delete(
	ctx context.Context,
	id uint,
) error {

	return r.db.
		WithContext(ctx).
		Delete(&models.Vehicle{}, id).
		Error
}
