package events

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

type RideAssignedEvent struct {
	RideID      int64  `json:"ride_id"`
	PassengerID uint64 `json:"passenger_id"`
	DriverID    uint64 `json:"driver_id"`
	DriverName  string `json:"driver_name"`
}

type RideSearchExpiredEvent struct {
	RideID      int64  `json:"ride_id"`
	PassengerID uint64 `json:"passenger_id"`
}

type RideCancelledEvent struct {
	RideID      int64   `json:"ride_id"`
	PassengerID uint64  `json:"passenger_id"`
	DriverID    *uint64 `json:"driver_id,omitempty"`
	CancelledBy string  `json:"cancelled_by"`
}

type RideRejectedEvent struct {
	RideID   int64  `json:"ride_id"`
	DriverID uint64 `json:"driver_id"`
}

type RideAcceptedEvent struct {
	RideID   int64  `json:"ride_id"`
	DriverID uint64 `json:"driver_id"`
}

type RideTakenEvent struct {
	RideID          int64  `json:"ride_id"`
	DriverID        uint64 `json:"driver_id"`
	WinningDriverID uint64 `json:"winning_driver_id"`
}

type RideCompletedEvent struct {
	RideID      int64  `json:"ride_id"`
	PassengerID uint64 `json:"passenger_id"`
	DriverID    uint64 `json:"driver_id"`
}
