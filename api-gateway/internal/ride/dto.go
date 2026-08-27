package ride

type CreateRideRequest struct {
	Pickup struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Address   string  `json:"address"`
	} `json:"pickup"`

	Destination struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Address   string  `json:"address"`
	} `json:"destination"`

	VehicleType string `json:"vehicle_type"`
	PassengerID int64  `json:"passengerId"`
}
