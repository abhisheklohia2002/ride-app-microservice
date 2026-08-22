package enums

type RideStatus string

const (
	RideStatusRequested       RideStatus = "REQUESTED"
	RideStatusSearchingDriver RideStatus = "SEARCHING_DRIVER"
	RideStatusDriverAssigned  RideStatus = "DRIVER_ASSIGNED"
	RideStatusDriverArriving  RideStatus = "DRIVER_ARRIVING"
	RideStatusDriverArrived   RideStatus = "DRIVER_ARRIVED"
	RideStatusTripStarted     RideStatus = "TRIP_STARTED"
	RideStatusTripCompleted   RideStatus = "TRIP_COMPLETED"
)
