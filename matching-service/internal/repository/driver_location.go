package repository

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

const DriverLocationKey = "drivers:locations"

type DriverLocationRepository struct {
	rdb *redis.Client
}

func NewDriverLocationRepository(
	rdb *redis.Client,
) *DriverLocationRepository {
	return &DriverLocationRepository{
		rdb: rdb,
	}
}

func (r *DriverLocationRepository) UpdateLocation(
	ctx context.Context,
	driverID uint64,
	latitude float64,
	longitude float64,
) error {

	return r.rdb.GeoAdd(
		ctx,
		DriverLocationKey,
		&redis.GeoLocation{
			Name:      driverIDString(driverID),
			Longitude: longitude,
			Latitude:  latitude,
		},
	).Err()
}

func (r *DriverLocationRepository) FindNearbyDrivers(
	ctx context.Context,
	latitude float64,
	longitude float64,
	radius float64,
) ([]redis.GeoLocation, error) {

	return r.rdb.GeoSearchLocation(
		ctx,
		DriverLocationKey,
		&redis.GeoSearchLocationQuery{
			GeoSearchQuery: redis.GeoSearchQuery{
				Longitude:  longitude,
				Latitude:   latitude,
				Radius:     radius,
				RadiusUnit: "km",
				Count:      50,
				Sort:       "ASC",
			},
		},
	).Result()
}

func driverIDString(id uint64) string {
	return fmt.Sprintf("driver:%d", id)
}
