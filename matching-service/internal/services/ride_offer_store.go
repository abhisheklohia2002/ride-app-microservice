package services

import "sync"

type RideOfferStore struct {
	mu   sync.RWMutex
	data map[int64]uint64
}

func NewRideOfferStore() *RideOfferStore {
	return &RideOfferStore{data: make(map[int64]uint64)}
}

func (s *RideOfferStore) Set(rideID int64, driverID uint64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[rideID] = driverID
}

func (s *RideOfferStore) Get(rideID int64) (uint64, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	driverID, ok := s.data[rideID]
	return driverID, ok
}

func (s *RideOfferStore) Remove(rideID int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.data, rideID)
}
