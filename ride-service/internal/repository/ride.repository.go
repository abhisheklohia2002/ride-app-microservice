package repository

import (
	"context"
	"errors"
	"time"

	"github.com/ride-service/internal/enums"
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
	Transaction(
		ctx context.Context,
		fn func(tx *gorm.DB) error,
	) error
	CreateRideTx(
		ctx context.Context,
		tx *gorm.DB,
		req models.Ride,
	) (*models.Ride, error)

	CreateOutboxEvent(
		ctx context.Context,
		tx *gorm.DB,
		event models.OutboxEvent,
	) error

	GetPendingOutboxEvents(
		ctx context.Context,
		limit int,
	) ([]models.OutboxEvent, error)

	MarkOutboxPublished(
		ctx context.Context,
		id uint64,
	) error

	IncrementOutboxRetry(
		ctx context.Context,
		id uint64,
	) error
	UpdateRideTx(
		ctx context.Context,
		tx *gorm.DB,
		ride *models.Ride,
	) (*models.Ride, error)
	GetActiveRideByPassengerID(
		ctx context.Context,
		passengerID uint64,
	) (*models.Ride, error)
	GetActiveRideByDriverID(
		ctx context.Context,
		driverID uint64,
	) (*models.Ride, error)

	AssignDriver(
		ctx context.Context,
		tx *gorm.DB,
		rideID uint64,
		driverID uint64,
	) (bool, error)
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

func (r repositoryImpl) Transaction(
	ctx context.Context,
	fn func(tx *gorm.DB) error,
) error {

	return r.db.WithContext(ctx).Transaction(fn)
}

func (r repositoryImpl) CreateRideTx(
	ctx context.Context,
	tx *gorm.DB,
	req models.Ride,
) (*models.Ride, error) {

	if err := tx.WithContext(ctx).
		Create(&req).
		Error; err != nil {
		return nil, err
	}

	return &req, nil
}

func (r repositoryImpl) CreateOutboxEvent(
	ctx context.Context,
	tx *gorm.DB,
	event models.OutboxEvent,
) error {

	return tx.WithContext(ctx).
		Create(&event).
		Error
}

func (r repositoryImpl) GetPendingOutboxEvents(
	ctx context.Context,
	limit int,
) ([]models.OutboxEvent, error) {

	var events []models.OutboxEvent

	err := r.db.WithContext(ctx).
		Where(
			"status = ?",
			string(enums.OutboxStatusPending),
		).
		Order("id ASC").
		Limit(limit).
		Find(&events).
		Error

	return events, err
}

func (r repositoryImpl) MarkOutboxPublished(
	ctx context.Context,
	id uint64,
) error {

	now := time.Now()

	return r.db.WithContext(ctx).
		Model(&models.OutboxEvent{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":       string(enums.OutboxStatusPublished),
			"published_at": now,
		}).
		Error
}

func (r repositoryImpl) IncrementOutboxRetry(
	ctx context.Context,
	id uint64,
) error {

	return r.db.WithContext(ctx).
		Model(&models.OutboxEvent{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"retry_count": gorm.Expr("retry_count + ?", 1),
		}).
		Error
}

func (r repositoryImpl) UpdateRideTx(
	ctx context.Context,
	tx *gorm.DB,
	ride *models.Ride,
) (*models.Ride, error) {

	if err := tx.WithContext(ctx).
		Save(ride).
		Error; err != nil {
		return nil, err
	}

	return ride, nil
}

func (r *repositoryImpl) GetActiveRideByPassengerID(
	ctx context.Context,
	passengerID uint64,
) (*models.Ride, error) {

	var ride models.Ride

	err := r.db.WithContext(ctx).
		Where(
			"passenger_id = ? AND status IN ?",
			passengerID,
			[]string{
				"SEARCHING_DRIVER",
				"DRIVER_ASSIGNED",
				"DRIVER_ARRIVING",
				"DRIVER_ARRIVED",
				"TRIP_STARTED",
			},
		).
		First(&ride).
		Error

	if err != nil {
		return nil, err
	}

	return &ride, nil
}

func (r *repositoryImpl) GetActiveRideByDriverID(
	ctx context.Context,
	driverID uint64,
) (*models.Ride, error) {

	var ride models.Ride

	err := r.db.WithContext(ctx).
		Where(
			"driver_id = ? AND status IN ?",
			driverID,
			[]string{
				"DRIVER_ASSIGNED",
				"DRIVER_ARRIVING",
				"DRIVER_ARRIVED",
				"TRIP_STARTED",
			},
		).
		First(&ride).
		Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &ride, nil
}

func (r repositoryImpl) AssignDriver(
	ctx context.Context,
	tx *gorm.DB,
	rideID uint64,
	driverID uint64,
) (bool, error) {

	result := tx.WithContext(ctx).
		Model(&models.Ride{}).
		Where(
			"id = ? AND status = ?",
			rideID,
			enums.RideStatusSearchingDriver,
		).
		Updates(map[string]any{
			"driver_id": driverID,
			"status":    enums.RideStatusDriverAssigned,
		})

	if result.Error != nil {
		return false, result.Error
	}

	return result.RowsAffected == 1, nil
}
