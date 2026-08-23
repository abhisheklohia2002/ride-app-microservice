package events

type DriverLocationUpdatedEvent struct {
	DriverID  uint64  `json:"driver_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
