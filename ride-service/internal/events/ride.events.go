package events

type RideSearchingEvent struct {
	RideID           int64   `json:"ride_id"`
	PassengerID      int64   `json:"passenger_id"`
	PickupLatitude   float64 `json:"pickup_latitude"`
	PickupLongitude  float64 `json:"pickup_longitude"`
	DropoffLatitude  float64 `json:"dropoff_latitude"`
	DropoffLongitude float64 `json:"dropoff_longitude"`
	VehicleType      string  `json:"vehicle_type"`
}

type RideAssignedEvent struct {
	RideID      int64  `json:"ride_id"`
	PassengerID uint64 `json:"passenger_id"`
	DriverID    uint64 `json:"driver_id"`
	DriverName  string `json:"driver_name"`
}

type RideCancelledEvent struct {
	RideID      int64   `json:"ride_id"`
	PassengerID uint64  `json:"passenger_id"`
	DriverID    *uint64 `json:"driver_id,omitempty"`
	CancelledBy string  `json:"cancelled_by"`
}

type RideCompletedEvent struct {
	RideID      int64  `json:"ride_id"`
	PassengerID uint64 `json:"passenger_id"`
	DriverID    uint64 `json:"driver_id"`
}
