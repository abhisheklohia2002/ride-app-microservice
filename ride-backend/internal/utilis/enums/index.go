package enums

type ROLE string
type BOOKINGSTATUS string
type PAYMENTSTATUS string

const (
	CUSTOMER ROLE = "CUSTOMER"
	ADMIN    ROLE = "ADMIN"
	DRIVER   ROLE = "DRIVER"
)

const (
	BookingStatusRequested       BOOKINGSTATUS = "requested"
	BookingStatusSearchingDriver BOOKINGSTATUS = "searching_driver"
	BookingStatusDriverAssigned  BOOKINGSTATUS = "driver_assigned"
	BookingStatusDriverWaiting   BOOKINGSTATUS = "driver_waiting"
	BookingStatusRideStarted     BOOKINGSTATUS = "ride_started"
	BookingStatusRideCompleted   BOOKINGSTATUS = "ride_completed"
	BookingStatusCancelled       BOOKINGSTATUS = "cancelled"
	BookingStatusNoDriverFound   BOOKINGSTATUS = "no_driver_found"
)

const (
	PaymentStatusPending  PAYMENTSTATUS = "pending"
	PaymentStatusPaid     PAYMENTSTATUS = "paid"
	PaymentStatusFailed   PAYMENTSTATUS = "failed"
	PaymentStatusRefunded PAYMENTSTATUS = "refunded"
)
