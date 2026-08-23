package handlers

import "github.com/ride-app/ride-service/internal/services"

type ridehandlerImpl struct {
	svc services.Service
}

func NewRideHandlers(
	svc services.Service,
) *ridehandlerImpl {
	return &ridehandlerImpl{svc: svc}
}
