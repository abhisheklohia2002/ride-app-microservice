package services

import (
	"context"

	"github.com/ride-app/ride-matching-service/internal/repository"
)

type MatchingService struct {
	driverLocationRepo *repository.DriverLocationRepository
}

func NewMatchingService(
	driverLocationRepo *repository.DriverLocationRepository,
) *MatchingService {
	return &MatchingService{
		driverLocationRepo: driverLocationRepo,
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

	result := make([]string, 0, len(drivers))

	for _, driver := range drivers {
		result = append(result, driver.Name)
	}

	return result, nil
}
