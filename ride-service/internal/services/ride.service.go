package services

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/ride-service/internal/clinets/matching"
	"github.com/ride-service/internal/enums"
	"github.com/ride-service/internal/events"
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
	AcceptRide(
		ctx context.Context,
		req dto.AcceptRideRequest,
	) (*models.Ride, error)
	CancelRide(
		ctx context.Context,
		req dto.CancelRideRequest,
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
		PassengerID: uint64(req.PassengerID),

		PickupLatitude:  req.Pickup.Latitude,
		PickupLongitude: req.Pickup.Longitude,

		DropoffLatitude:  req.Destination.Latitude,
		DropoffLongitude: req.Destination.Longitude,

		Status: string(enums.RideStatusSearchingDriver),

		RequestedAt: time.Now(),
	}

	var createdRide *models.Ride

	err := s.repo.Transaction(
		ctx,
		func(tx *gorm.DB) error {

			var err error

			createdRide, err = s.repo.CreateRideTx(
				ctx,
				tx,
				ride,
			)

			if err != nil {
				return err
			}

			requestedHistory := models.RideStatusHistory{
				RideID:     createdRide.ID,
				FromStatus: "",
				ToStatus:   string(enums.RideStatusRequested),
				ChangedBy:  "PASSENGER",
			}

			if err := s.repo.CreateRideStatusHistory(
				ctx,
				tx,
				requestedHistory,
			); err != nil {
				return err
			}

			searchingHistory := models.RideStatusHistory{
				RideID:     createdRide.ID,
				FromStatus: string(enums.RideStatusRequested),
				ToStatus:   string(enums.RideStatusSearchingDriver),
				ChangedBy:  "SYSTEM",
			}

			if err := s.repo.CreateRideStatusHistory(
				ctx,
				tx,
				searchingHistory,
			); err != nil {
				return err
			}

			searchingEvent := events.RideSearchingEvent{
				RideID:           int64(createdRide.ID),
				PassengerID:      int64(createdRide.PassengerID),
				PickupLatitude:   createdRide.PickupLatitude,
				PickupLongitude:  createdRide.PickupLongitude,
				DropoffLatitude:  createdRide.DropoffLatitude,
				DropoffLongitude: createdRide.DropoffLongitude,
				VehicleType:      req.VehicleType,
			}

			payload, err := json.Marshal(searchingEvent)
			if err != nil {
				return err
			}

			outboxEvent := models.OutboxEvent{
				EventType:     "RIDE_SEARCHING",
				AggregateType: "RIDE",
				AggregateID:   createdRide.ID,
				Payload:       string(payload),
				Status:        string(enums.OutboxStatusPending),
			}

			if err := s.repo.CreateOutboxEvent(
				ctx,
				tx,
				outboxEvent,
			); err != nil {
				return err
			}

			return nil
		},
	)

	if err != nil {
		return nil, err
	}

	createdRide.Status = string(
		enums.RideStatusSearchingDriver,
	)

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

func (s serviceImpl) AcceptRide(
	ctx context.Context,
	req dto.AcceptRideRequest,
) (*models.Ride, error) {

	if req.RideID == 0 {
		return nil, errors.New("ride id is required")
	}

	if req.DriverID == 0 {
		return nil, errors.New("driver id is required")
	}

	var ride *models.Ride

	err := s.repo.Transaction(
		ctx,
		func(tx *gorm.DB) error {

			var err error

			ride, err = s.repo.GetRideByID(
				ctx,
				tx,
				uint64(req.RideID),
			)
			if err != nil {
				return err
			}

			if ride == nil {
				return errors.New("ride not found")
			}

			if ride.Status != string(
				enums.RideStatusSearchingDriver,
			) {
				return errors.New(
					"ride is not available for assignment",
				)
			}

			ride.DriverID = &req.DriverID
			ride.Status = string(
				enums.RideStatusDriverAssigned,
			)

			updatedRide, err :=
				s.repo.UpdateRideTx(
					ctx,
					tx,
					ride,
				)
			if err != nil {
				return err
			}

			history := models.RideStatusHistory{
				RideID:     updatedRide.ID,
				FromStatus: string(enums.RideStatusSearchingDriver),
				ToStatus:   string(enums.RideStatusDriverAssigned),
				ChangedBy:  "DRIVER",
			}

			if err := s.repo.CreateRideStatusHistory(
				ctx,
				tx,
				history,
			); err != nil {
				return err
			}

			event := events.RideAssignedEvent{
				RideID:      int64(updatedRide.ID),
				PassengerID: updatedRide.PassengerID,
				DriverID:    req.DriverID,
				DriverName:  "David",
			}

			payload, err := json.Marshal(event)
			if err != nil {
				return err
			}

			outboxEvent := models.OutboxEvent{
				EventType:     "RIDE_ASSIGNED",
				AggregateType: "RIDE",
				AggregateID:   updatedRide.ID,
				Payload:       string(payload),
				Status:        string(enums.OutboxStatusPending),
			}

			if err := s.repo.CreateOutboxEvent(
				ctx,
				tx,
				outboxEvent,
			); err != nil {
				return err
			}

			ride = updatedRide

			return nil
		},
	)

	if err != nil {
		return nil, err
	}

	return ride, nil
}

func (s serviceImpl) CancelRide(
	ctx context.Context,
	req dto.CancelRideRequest,
) (*models.Ride, error) {

	if req.RideID == 0 {
		return nil, errors.New("ride id is required")
	}

	if req.CancelledBy == "" {
		return nil, errors.New("cancelled by is required")
	}

	var ride *models.Ride

	err := s.repo.Transaction(
		ctx,
		func(tx *gorm.DB) error {

			var err error

			ride, err = s.repo.GetRideByID(
				ctx,
				tx,
				uint64(req.RideID),
			)
			if err != nil {
				return err
			}

			if ride == nil {
				return errors.New("ride not found")
			}

			switch ride.Status {
			case string(enums.RideStatusRequested),
				string(enums.RideStatusSearchingDriver),
				string(enums.RideStatusDriverAssigned),
				string(enums.RideStatusDriverArriving),
				string(enums.RideStatusDriverArrived):

			default:
				return errors.New(
					"ride cannot be cancelled in current status",
				)
			}

			oldStatus := ride.Status

			ride.Status = string(
				enums.RideStatusCancelled,
			)

			updatedRide, err :=
				s.repo.UpdateRideTx(
					ctx,
					tx,
					ride,
				)
			if err != nil {
				return err
			}

			history := models.RideStatusHistory{
				RideID:     updatedRide.ID,
				FromStatus: oldStatus,
				ToStatus: string(
					enums.RideStatusCancelled,
				),
				ChangedBy: req.CancelledBy,
			}

			if err := s.repo.CreateRideStatusHistory(
				ctx,
				tx,
				history,
			); err != nil {
				return err
			}

			event := events.RideCancelledEvent{
				RideID:      int64(updatedRide.ID),
				PassengerID: updatedRide.PassengerID,
				DriverID:    updatedRide.DriverID,
				CancelledBy: req.CancelledBy,
			}

			payload, err := json.Marshal(event)
			if err != nil {
				return err
			}

			outboxEvent := models.OutboxEvent{
				EventType:     "RIDE_CANCELLED",
				AggregateType: "RIDE",
				AggregateID:   updatedRide.ID,
				Payload:       string(payload),
				Status: string(
					enums.OutboxStatusPending,
				),
			}

			if err := s.repo.CreateOutboxEvent(
				ctx,
				tx,
				outboxEvent,
			); err != nil {
				return err
			}

			ride = updatedRide

			return nil
		},
	)

	if err != nil {
		return nil, err
	}

	return ride, nil
}
