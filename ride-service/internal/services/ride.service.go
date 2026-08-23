package services

import (
	"context"
	"errors"
	"time"

	"github.com/ride-service/internal/clinets/matching"
	"github.com/ride-service/internal/enums"
	"github.com/ride-service/internal/handlers/dto"
	"github.com/ride-service/internal/models"
	"github.com/ride-service/internal/repository"
	"gorm.io/gorm"
)

type Service interface {
	CreateRide(
		ctx context.Context,
		req dto.CreateRequestRide,
	) (*models.Ride, error)
	TransitionRide(
		ctx context.Context,
		rideID uint64,
		toStatus enums.RideStatus,
		changedBy string,
	) (*models.Ride, error)
}

type serviceImpl struct {
	repo           repository.Repository
	matchingClient matching.Client
}

func NewRideService(
	repo repository.Repository,
	matchingClient matching.Client,

) Service {
	return &serviceImpl{
		repo:           repo,
		matchingClient: matchingClient,
	}
}

func (s serviceImpl) CreateRide(
	ctx context.Context,
	req dto.CreateRequestRide,
) (*models.Ride, error) {

	if req.PassengerID == 0 {
		return nil, errors.New("passenger id is required")
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

	var createdRide *models.Ride

	err := s.repo.Transaction(ctx, func(tx *gorm.DB) error {

		var err error

		createdRide, err = s.repo.CreateRideTx(
			ctx,
			tx,
			ride,
		)
		if err != nil {
			return err
		}

		history := models.RideStatusHistory{
			RideID:     createdRide.ID,
			FromStatus: "",
			ToStatus:   string(enums.RideStatusRequested),
			ChangedBy:  "PASSENGER",
		}

		return s.repo.CreateRideStatusHistory(
			ctx,
			tx,
			history,
		)
	})

	if err != nil {
		return nil, err
	}

	createdRide, err = s.TransitionRide(
		ctx,
		createdRide.ID,
		enums.RideStatusSearchingDriver,
		"SYSTEM",
	)

	if err != nil {
		return nil, err
	}

	return createdRide, nil
}

func (s serviceImpl) TransitionRide(
	ctx context.Context,
	rideID uint64,
	toStatus enums.RideStatus,
	changedBy string,
) (*models.Ride, error) {

	var updatedRide *models.Ride

	err := s.repo.Transaction(ctx, func(tx *gorm.DB) error {

		ride, err := s.repo.GetRideByID(
			ctx,
			tx,
			rideID,
		)
		if err != nil {
			return err
		}

		currentStatus := enums.RideStatus(
			ride.Status,
		)

		if !enums.IsValidRideTransition(
			currentStatus,
			toStatus,
		) {
			return errors.New(
				"invalid ride status transition",
			)
		}

		err = s.repo.UpdateRideStatus(
			ctx,
			tx,
			rideID,
			string(toStatus),
		)
		if err != nil {
			return err
		}

		history := models.RideStatusHistory{
			RideID:     ride.ID,
			FromStatus: string(currentStatus),
			ToStatus:   string(toStatus),
			ChangedBy:  changedBy,
		}

		err = s.repo.CreateRideStatusHistory(
			ctx,
			tx,
			history,
		)
		if err != nil {
			return err
		}

		ride.Status = string(toStatus)

		updatedRide = ride

		return nil
	})

	if err != nil {
		return nil, err
	}

	return updatedRide, nil
}
