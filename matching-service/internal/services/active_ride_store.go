package services

import "sync"

type ActiveRide struct {
	RideID      int64
	PassengerID uint64
	DriverID    uint64
}

type ActiveRideStore struct {
	mu       sync.RWMutex
	byDriver map[uint64]ActiveRide
}

func NewActiveRideStore() *ActiveRideStore {
	return &ActiveRideStore{
		byDriver: make(map[uint64]ActiveRide),
	}
}

func (s *ActiveRideStore) Set(
	rideID int64,
	passengerID uint64,
	driverID uint64,
) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.byDriver[driverID] = ActiveRide{
		RideID:      rideID,
		PassengerID: passengerID,
		DriverID:    driverID,
	}
}

func (s *ActiveRideStore) GetByDriver(
	driverID uint64,
) (ActiveRide, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ride, ok := s.byDriver[driverID]

	return ride, ok
}

func (s *ActiveRideStore) RemoveByDriver(
	driverID uint64,
) {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(
		s.byDriver,
		driverID,
	)
}
