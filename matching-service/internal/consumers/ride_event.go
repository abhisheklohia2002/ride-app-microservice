package consumers

type RideSearchingEvent struct {
	RideID          uint64  `json:"ride_id"`
	PassengerID     uint64  `json:"passenger_id"`
	PickupLatitude  float64 `json:"pickup_latitude"`
	PickupLongitude float64 `json:"pickup_longitude"`
	VehicleType     string  `json:"vehicle_type"`
}
