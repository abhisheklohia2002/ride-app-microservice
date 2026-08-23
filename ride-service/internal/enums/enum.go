package enums

type RideStatus string

const (
	RideStatusRequested       RideStatus = "REQUESTED"
	RideStatusSearchingDriver RideStatus = "SEARCHING_DRIVER"
	RideStatusDriverAssigned  RideStatus = "DRIVER_ASSIGNED"
	RideStatusDriverArriving  RideStatus = "DRIVER_ARRIVING"
	RideStatusDriverArrived   RideStatus = "DRIVER_ARRIVED"
	RideStatusDriverAccepted  RideStatus = "DRIVER_ACCEPTED"
	RideStatusTripStarted     RideStatus = "TRIP_STARTED"
	RideStatusTripCompleted   RideStatus = "TRIP_COMPLETED"
	RideStatusCancelled       RideStatus = "CANCELLED"
)
