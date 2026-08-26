package dto

type Location struct {
	Latitude  float64
	Longitude float64
	Address   string
}

type CreateRequestRide struct {
	PassengerID int64

	Pickup      Location
	Destination Location

	VehicleType string
}

type AcceptRideRequest struct {
	RideID   int64
	DriverID uint64
}

type CancelRideRequest struct {
	RideID      int64
	CancelledBy string
}
