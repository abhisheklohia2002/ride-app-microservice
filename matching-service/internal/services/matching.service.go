package services

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/ride-app/ride-matching-service/internal/events"
	"github.com/ride-app/ride-matching-service/internal/messaging/rabbitmq"
	"github.com/ride-app/ride-matching-service/internal/repository"
	
)

type MatchingService struct {
	driverLocationRepo *repository.DriverLocationRepository
	publisher          *rabbitmq.Publisher
}

func NewMatchingService(
	driverLocationRepo *repository.DriverLocationRepository,
	publisher *rabbitmq.Publisher,

) *MatchingService {
	return &MatchingService{
		driverLocationRepo: driverLocationRepo,
		publisher:          publisher,
	}
}

func (s *MatchingService) UpdateDriverLocation(
	ctx context.Context,
	driverID uint64,
	latitude float64,
	longitude float64,
) error {

	return s.driverLocationRepo.UpdateLocation(
		ctx,
		driverID,
		latitude,
		longitude,
	)
}

func (s *MatchingService) FindNearbyDrivers(
	ctx context.Context,
	latitude float64,
	longitude float64,
	radius float64,
) ([]string, error) {

	drivers, err := s.driverLocationRepo.FindNearbyDrivers(
		ctx,
		latitude,
		longitude,
		radius,
	)

	if err != nil {
		return nil, err
	}

	return drivers, nil
}

func (s *MatchingService) MatchRide(
	ctx context.Context,
	event events.RideCreatedEvent,
) error {

	drivers, err := s.FindNearbyDrivers(
		ctx,
		event.PickupLatitude,
		event.PickupLongitude,
		5,
	)
	if err != nil {
		return err
	}

	if len(drivers) == 0 {
		return errors.New("no nearby driver found")
	}

	driverName := drivers[0]

	driverIDString := strings.TrimPrefix(
		driverName,
		"driver:",
	)

	driverID, err := strconv.ParseUint(
		driverIDString,
		10,
		64,
	)
	if err != nil {
		return err
	}

	request := events.RideRequestedEvent{
		RideID:      event.RideID,
		PassengerID: event.PassengerID,
		DriverID:    driverID,

		PickupLatitude:  event.PickupLatitude,
		PickupLongitude: event.PickupLongitude,

		DropoffLatitude:  event.DropoffLatitude,
		DropoffLongitude: event.DropoffLongitude,

		VehicleType: event.VehicleType,
	}

	return s.publisher.Publish(
		ctx,
		"RIDE_REQUESTED",
		request,
	)
}
