package dto

type Location struct {
	Latitude  float64
	Longitude float64
	Address   string
}

type CreateRequestRide struct {
	PassengerID uint64

	Pickup      Location
	Destination Location

	VehicleType string
}
