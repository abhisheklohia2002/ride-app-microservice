package services

import (
	"context"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/ride-app/ride-matching-service/internal/events"
	"github.com/ride-app/ride-matching-service/internal/messaging/rabbitmq"
	"github.com/ride-app/ride-matching-service/internal/repository"
)

const (
	DriverSearchRadiusKm = 15
	RideSearchTimeout    = 2 * time.Minute
)

type MatchingService struct {
	driverLocationRepo *repository.DriverLocationRepository
	publisher          *rabbitmq.Publisher
	pendingRideStore   *PendingRideStore
	offerStore         *RideOfferStore
}

func NewMatchingService(
	driverLocationRepo *repository.DriverLocationRepository,
	publisher *rabbitmq.Publisher,
	pendingRideStore *PendingRideStore,
	offerStore *RideOfferStore,
) *MatchingService {
	return &MatchingService{
		driverLocationRepo: driverLocationRepo,
		publisher:          publisher,
		pendingRideStore:   pendingRideStore,
		offerStore:         offerStore,
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
	return s.driverLocationRepo.FindNearbyDrivers(
		ctx,
		latitude,
		longitude,
		radius,
	)
}

func (s *MatchingService) AddPendingRide(
	event events.RideSearchingEvent,
) {
	ride := PendingRide{
		RideID:           event.RideID,
		PassengerID:      uint64(event.PassengerID),
		PickupLatitude:   event.PickupLatitude,
		PickupLongitude:  event.PickupLongitude,
		DropoffLatitude:  event.DropoffLatitude,
		DropoffLongitude: event.DropoffLongitude,
		VehicleType:      event.VehicleType,
		CreatedAt:        time.Now(),
	}

	s.pendingRideStore.Set(ride)

	log.Printf(
		"PENDING STORE INSTANCE=%p SET ride=%d",
		s.pendingRideStore,
		ride.RideID,
	)
}

func (s *MatchingService) TryMatchRide(
	ctx context.Context,
	event events.RideSearchingEvent,
) error {
	ride := PendingRide{
		RideID:           event.RideID,
		PassengerID:      uint64(event.PassengerID),
		PickupLatitude:   event.PickupLatitude,
		PickupLongitude:  event.PickupLongitude,
		DropoffLatitude:  event.DropoffLatitude,
		DropoffLongitude: event.DropoffLongitude,
		VehicleType:      event.VehicleType,
		CreatedAt:        time.Now(),
	}

	if existingRide, ok := s.pendingRideStore.Get(
		event.RideID,
	); ok {
		ride = existingRide
	}

	return s.TryMatchPendingRide(
		ctx,
		ride,
	)
}

func (s *MatchingService) TryMatchPendingRide(
	ctx context.Context,
	ride PendingRide,
) error {
	if time.Since(ride.CreatedAt) >= RideSearchTimeout {
		return s.ExpirePendingRide(
			ctx,
			ride,
		)
	}

	drivers, err := s.FindNearbyDrivers(
		ctx,
		ride.PickupLatitude,
		ride.PickupLongitude,
		DriverSearchRadiusKm,
	)
	if err != nil {
		return err
	}

	if len(drivers) == 0 {
		log.Printf(
			"no nearby driver found ride=%d",
			ride.RideID,
		)

		return nil
	}

	driverName := drivers[time.Now().UnixNano()%int64(len(drivers))]

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

	log.Printf(
		"driver selected ride=%d driver=%d",
		ride.RideID,
		driverID,
	)

	request := events.RideRequestedEvent{
		RideID:           ride.RideID,
		PassengerID:      int64(ride.PassengerID),
		DriverID:         driverID,
		PickupLatitude:   ride.PickupLatitude,
		PickupLongitude:  ride.PickupLongitude,
		DropoffLatitude:  ride.DropoffLatitude,
		DropoffLongitude: ride.DropoffLongitude,
		VehicleType:      ride.VehicleType,
	}

	if err := s.publisher.Publish(
		ctx,
		rabbitmq.RideExchange,
		"RIDE_REQUESTED",
		request,
	); err != nil {
		return err
	}

	s.offerStore.Set(ride.RideID, driverID)

	s.pendingRideStore.Remove(
		ride.RideID,
	)

	log.Printf(
		"ride request published ride=%d driver=%d",
		ride.RideID,
		driverID,
	)

	return nil
}

func (s *MatchingService) OfferedDriver(rideID int64) (uint64, bool) {
	return s.offerStore.Get(rideID)
}

func (s *MatchingService) RemoveOfferedRide(rideID int64) {
	s.offerStore.Remove(rideID)
}

func (s *MatchingService) PublishCancellationForDriver(
	ctx context.Context,
	event events.RideCancelledEvent,
) error {
	return s.publisher.Publish(
		ctx,
		rabbitmq.RideExchange,
		"RIDE_CANCELLED_DRIVER",
		event,
	)
}

func (s *MatchingService) RetryPendingRides(
	ctx context.Context,
) error {
	rides := s.pendingRideStore.GetAll()

	log.Printf(
		"PENDING STORE INSTANCE=%p COUNT=%d",
		s.pendingRideStore,
		len(rides),
	)

	for _, ride := range rides {
		log.Printf(
			"retrying ride=%d",
			ride.RideID,
		)

		if err := s.TryMatchPendingRide(
			ctx,
			ride,
		); err != nil {
			log.Printf(
				"failed to retry ride=%d: %v",
				ride.RideID,
				err,
			)
		}
	}

	return nil
}

func (s *MatchingService) ExpirePendingRide(
	ctx context.Context,
	ride PendingRide,
) error {
	event := events.RideSearchExpiredEvent{
		RideID:      ride.RideID,
		PassengerID: ride.PassengerID,
	}

	if err := s.publisher.Publish(
		ctx,
		rabbitmq.RideExchange,
		"RIDE_SEARCH_EXPIRED",
		event,
	); err != nil {
		return err
	}

	s.pendingRideStore.Remove(
		ride.RideID,
	)

	log.Printf(
		"ride search expired ride=%d",
		ride.RideID,
	)

	return nil
}
