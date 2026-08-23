package services

import (
	"context"
	"errors"
	"time"

	"github.com/ride-service/internal/enums"
	"github.com/ride-service/internal/handlers/dto"
	"github.com/ride-service/internal/models"
	"github.com/ride-service/internal/repository"
)

type Service interface {
	CreateRide(
		ctx context.Context,
		req dto.CreateRequestRide,
	) (*models.Ride, error)
}

type serviceImpl struct {
	repo repository.Repository
}

func NewRideService(
	repo repository.Repository,
) Service {
	return &serviceImpl{
		repo: repo,
	}
}

func (s serviceImpl) CreateRide(
	ctx context.Context,
	req dto.CreateRequestRide,
) (*models.Ride, error) {

	if req.PassengerID == 0 {
		return nil, errors.New("passenger id is required")
	}

	if req.Pickup.Latitude < -90 ||
		req.Pickup.Latitude > 90 {
		return nil, errors.New("invalid pickup latitude")
	}

	if req.Pickup.Longitude < -180 ||
		req.Pickup.Longitude > 180 {
		return nil, errors.New("invalid pickup longitude")
	}

	if req.Destination.Latitude < -90 ||
		req.Destination.Latitude > 90 {
		return nil, errors.New("invalid destination latitude")
	}

	if req.Destination.Longitude < -180 ||
		req.Destination.Longitude > 180 {
		return nil, errors.New("invalid destination longitude")
	}

	ride := models.Ride{
		PassengerID: req.PassengerID,

		PickupLatitude:  req.Pickup.Latitude,
		PickupLongitude: req.Pickup.Longitude,

		DropoffLatitude:  req.Destination.Latitude,
		DropoffLongitude: req.Destination.Longitude,

		Status: string(enums.RideStatusRequested),

		RequestedAt: time.Now(),
	}

	createdRide, err := s.repo.CreateRide(
		ctx,
		ride,
	)
	if err != nil {
		return nil, err
	}

	return createdRide, nil
}
