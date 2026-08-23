package vehicle

import (
	"context"

	"github.com/ride-app/ride-driver-service/internal/dto"
	"github.com/ride-app/ride-driver-service/internal/models"
	vehicle "github.com/ride-app/ride-driver-service/internal/repository/vehicles"
)

type Vehicle interface {
	Create(
		ctx context.Context,
		req dto.CreateVehicleRequest,
	) (*models.Vehicle, error)

	GetAll(
		ctx context.Context,
	) ([]models.Vehicle, error)

	GetByID(
		ctx context.Context,
		id uint,
	) (*models.Vehicle, error)

	Update(
		ctx context.Context,
		id uint,
		req dto.UpdateVehicleRequest,
	) (*models.Vehicle, error)

	Delete(
		ctx context.Context,
		id uint,
	) error
}

type vehicleService struct {
	repo vehicle.Vehicle
}

func NewVehicleService(repo vehicle.Vehicle) Vehicle {
	return &vehicleService{repo: repo}
}

func (s *vehicleService) Create(
	ctx context.Context,
	req dto.CreateVehicleRequest,
) (*models.Vehicle, error) {

	v := &models.Vehicle{
		UserID:      req.UserID,
		FullName:    req.FullName,
		PlateNumber: req.PlateNumber,
		Status:      req.Status,
	}

	if err := s.repo.Create(ctx, v); err != nil {
		return nil, err
	}

	return v, nil
}

func (s *vehicleService) GetAll(
	ctx context.Context,
) ([]models.Vehicle, error) {

	return s.repo.GetAll(ctx)
}

func (s *vehicleService) GetByID(
	ctx context.Context,
	id uint,
) (*models.Vehicle, error) {

	return s.repo.GetByID(ctx, id)
}

func (s *vehicleService) Update(
	ctx context.Context,
	id uint,
	req dto.UpdateVehicleRequest,
) (*models.Vehicle, error) {

	v, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.FullName != nil {
		v.FullName = *req.FullName
	}

	if req.PlateNumber != nil {
		v.PlateNumber = *req.PlateNumber
	}
	v.Status = *req.Status
	

	if err := s.repo.Update(ctx, v); err != nil {
		return nil, err
	}

	return v, nil
}

func (s *vehicleService) Delete(
	ctx context.Context,
	id uint,
) error {

	return s.repo.Delete(ctx, id)
}
