package enums

func IsValidRideTransition(
	from RideStatus,
	to RideStatus,
) bool {

	switch from {

	case RideStatusRequested:
		return to == RideStatusSearchingDriver ||
			to == RideStatusCancelled  

	case RideStatusSearchingDriver:
		return to == RideStatusDriverAssigned ||
			to == RideStatusCancelled

	case RideStatusDriverAssigned:
		return to == RideStatusDriverAccepted ||
			to == RideStatusCancelled

	case RideStatusDriverAccepted:
		return to == RideStatusDriverArriving ||
			to == RideStatusCancelled

	case RideStatusDriverArriving:
		return to == RideStatusDriverArrived ||
			to == RideStatusCancelled

	case RideStatusDriverArrived:
		return to == RideStatusTripStarted

	case RideStatusTripStarted:
		return to == RideStatusTripCompleted

	case RideStatusTripCompleted:
		return false

	case RideStatusCancelled:
		return false
	}

	return false
}
