package services

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/ride-service/internal/clinets/matching"
	"github.com/ride-service/internal/enums"
	"github.com/ride-service/internal/events"
	"github.com/ride-service/internal/handlers/dto"
	"github.com/ride-service/internal/messaging/rabbitmq"
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
		rideID uint64,
		driverID uint64,
	) (*models.Ride, bool, error)
	CancelRide(
		ctx context.Context,
		req dto.CancelRideRequest,
	) (*models.Ride, error)
	GetActiveRideByPassengerID(
		ctx context.Context,
		passengerID uint64,
	) (*models.Ride, error)
	GetActiveRideByDriverID(
		ctx context.Context,
		driverID uint64,
	) (*models.Ride, error)
	CompleteRide(
		ctx context.Context,
		rideID uint64,
	) (*models.Ride, error)
}

type serviceImpl struct {
	repo           repository.Repository
	matchingClient matching.Client
	publister      rabbitmq.Publisher
}

func NewRideService(
	repo repository.Repository,
	matchingClient matching.Client,
	publister rabbitmq.Publisher,

) Service {
	return &serviceImpl{
		repo:           repo,
		matchingClient: matchingClient,
		publister:      publister,
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
	rideID uint64,
	driverID uint64,
) (*models.Ride, bool, error) {
	log.Printf(
		"ACCEPT RIDE REQUEST ride=%d driver=%d",
		rideID,
		driverID,
	)
	if rideID == 0 {
		return nil, false, errors.New("ride id is required")
	}

	if driverID == 0 {
		return nil, false, errors.New("driver id is required")
	}

	var ride *models.Ride
	var assigned bool

	err := s.repo.Transaction(
		ctx,
		func(tx *gorm.DB) error {

			var err error

			ride, err = s.repo.GetRideByID(
				ctx,
				tx,
				rideID,
			)
			if err != nil {
				return err
			}

			if ride == nil {
				return errors.New("ride not found")
			}

			log.Printf(
				"CALLING ASSIGN DRIVER ride=%d driver=%d",
				rideID,
				driverID,
			)
			// Atomic assignment
			assigned, err =
				s.repo.AssignDriver(
					ctx,
					tx,
					rideID,
					driverID,
				)
			log.Printf(
				"ASSIGN DRIVER RESULT ride=%d driver=%d assigned=%v err=%v",
				rideID,
				driverID,
				assigned,
				err,
			)
			if err != nil {
				return err
			}

			if !assigned {
				return nil
			}

			ride.DriverID = &driverID
			ride.Status = string(
				enums.RideStatusDriverAssigned,
			)

			return nil
		},
	)

	if err != nil {
		return nil, false, err
	}

	if !assigned {
		return nil, false, nil
	}

	log.Printf(
		"ASSIGN DRIVER RESULT ride=%d driver=%d assigned=%v",
		rideID,
		driverID,
		assigned,
	)
	// Publish RIDE_ASSIGNED here.
	event := events.RideAssignedEvent{
		RideID:      int64(ride.ID),
		PassengerID: ride.PassengerID,
		DriverID:    driverID,
	}

	body, err := json.Marshal(event)
	if err != nil {
		return nil, false, err
	}

	log.Printf(
		"RIDE_ASSIGNED publishing ride=%d passenger=%d driver=%d",
		ride.ID,
		ride.PassengerID,
		driverID,
	)
	if err := s.publister.Publish(
		"RIDE_ASSIGNED",
		body,
	); err != nil {
		return nil, false, err
	}

	return ride, true, nil
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
	if req.CancelledBy != "PASSENGER" && req.CancelledBy != "DRIVER" {
		return nil, errors.New("invalid cancellation actor")
	}
	if req.CancelledBy == "DRIVER" && req.DriverID == nil {
		return nil, errors.New("driver id is required for driver cancellation")
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

			if !enums.IsValidRideTransition(
				enums.RideStatus(ride.Status),
				enums.RideStatusCancelled,
			) {
				log.Println("enums.RideStatus(ride.Status)", enums.RideStatus(ride.Status))
				return errors.New(
					"ride cannot be cancelled in current status",
				)
			}

			oldStatus := ride.Status

			ride.Status = string(
				enums.RideStatusCancelled,
			)
			now := time.Now()
			ride.CancelledAt = &now

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

			// A driver can decline a request before accepting it, so the ride
			// has no assigned driver yet. Preserve that recipient in the event.
			if event.DriverID == nil && req.DriverID != nil {
				event.DriverID = req.DriverID
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

func (s serviceImpl) GetActiveRideByPassengerID(
	ctx context.Context,
	passengerID uint64,
) (*models.Ride, error) {

	if passengerID == 0 {
		return nil, errors.New("passenger id is required")
	}

	return s.repo.GetActiveRideByPassengerID(
		ctx,
		passengerID,
	)
}

func (s serviceImpl) GetActiveRideByDriverID(
	ctx context.Context,
	driverID uint64,
) (*models.Ride, error) {

	if driverID == 0 {
		return nil, errors.New("driver id is required")
	}

	return s.repo.GetActiveRideByDriverID(
		ctx,
		driverID,
	)
}

func (s serviceImpl) CompleteRide(
	ctx context.Context,
	rideID uint64,
) (*models.Ride, error) {

	if rideID == 0 {
		return nil, errors.New("ride id is required")
	}

	var ride *models.Ride

	err := s.repo.Transaction(
		ctx,
		func(tx *gorm.DB) error {

			var err error

			ride, err = s.repo.GetRideByID(
				ctx,
				tx,
				rideID,
			)
			if err != nil {
				return err
			}

			if ride == nil {
				return errors.New("ride not found")
			}

			ride.Status = string(
				enums.RideStatusTripCompleted,
			)

			updatedRide, err := s.repo.UpdateRideTx(
				ctx,
				tx,
				ride,
			)
			if err != nil {
				return err
			}

			ride = updatedRide

			return nil
		},
	)

	if err != nil {
		return nil, err
	}

	// Publish completion event after DB transaction succeeds.
	event := events.RideCompletedEvent{
		RideID:      int64(ride.ID),
		PassengerID: uint64(ride.PassengerID),
		DriverID:    uint64(*ride.DriverID),
	}

	body, err := json.Marshal(event)
	if err != nil {
		return nil, err
	}

	if err := s.publister.Publish(
		"RIDE_COMPLETED",
		body,
	); err != nil {
		return nil, err
	}

	

	return ride, nil
}
