package events

type DriverLocationUpdatedEvent struct {
	DriverID  uint64  `json:"driver_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type RideCreatedEvent struct {
	RideID           int64   `json:"ride_id"`
	PassengerID      int64   `json:"passenger_id"`
	PickupLatitude   float64 `json:"pickup_latitude"`
	PickupLongitude  float64 `json:"pickup_longitude"`
	DropoffLatitude  float64 `json:"dropoff_latitude"`
	DropoffLongitude float64 `json:"dropoff_longitude"`
	VehicleType      string  `json:"vehicle_type"`
}

type RideSearchingEvent struct {
	RideID           int64   `json:"ride_id"`
	PassengerID      int64   `json:"passenger_id"`
	PickupLatitude   float64 `json:"pickup_latitude"`
	PickupLongitude  float64 `json:"pickup_longitude"`
	DropoffLatitude  float64 `json:"dropoff_latitude"`
	DropoffLongitude float64 `json:"dropoff_longitude"`
	VehicleType      string  `json:"vehicle_type"`
}

type RideRequestedEvent struct {
	RideID           int64   `json:"ride_id"`
	PassengerID      int64   `json:"passenger_id"`
	DriverID         uint64  `json:"driver_id"`
	PickupLatitude   float64 `json:"pickup_latitude"`
	PickupLongitude  float64 `json:"pickup_longitude"`
	DropoffLatitude  float64 `json:"dropoff_latitude"`
	DropoffLongitude float64 `json:"dropoff_longitude"`
	VehicleType      string  `json:"vehicle_type"`
}


type RideTakenEvent struct {
	RideID          int64  `json:"ride_id"`
	DriverID        uint64 `json:"driver_id"`
	WinningDriverID uint64 `json:"winning_driver_id"`
}	