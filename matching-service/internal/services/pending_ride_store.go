package services

import (
	"sync"
	"time"
)

type PendingRide struct {
	RideID           int64
	PassengerID      uint64
	PickupLatitude   float64
	PickupLongitude  float64
	DropoffLatitude  float64
	DropoffLongitude float64
	VehicleType      string
	CreatedAt        time.Time
}

type PendingRideStore struct {
	mu   sync.RWMutex
	data map[int64]PendingRide
}

func NewPendingRideStore() *PendingRideStore {
	return &PendingRideStore{
		data: make(map[int64]PendingRide),
	}
}

func (s *PendingRideStore) Set(
	ride PendingRide,
) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.data[ride.RideID] = ride
}

func (s *PendingRideStore) Get(
	rideID int64,
) (PendingRide, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ride, ok := s.data[rideID]

	return ride, ok
}

func (s *PendingRideStore) GetAll() []PendingRide {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make(
		[]PendingRide,
		0,
		len(s.data),
	)

	for _, ride := range s.data {
		result = append(
			result,
			ride,
		)
	}

	return result
}

func (s *PendingRideStore) Remove(
	rideID int64,
) {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(
		s.data,
		rideID,
	)
}
