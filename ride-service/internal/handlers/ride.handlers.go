package handlers

import (
	"context"
	"time"

	pb "github.com/ride-app/shared/pkg/ride"
	"github.com/ride-service/internal/handlers/dto"
	"github.com/ride-service/internal/services"
)

type RideHandlerImpl struct {
	svc services.Service
	pb.UnimplementedRideServiceServer
}

func NewRideHandlers(
	svc services.Service,
) *RideHandlerImpl {
	return &RideHandlerImpl{
		svc: svc,
	}
}

func (h *RideHandlerImpl) CreateRide(
	ctx context.Context,
	req *pb.CreateRideRequest,
) (*pb.RideResponse, error) {

	createReq := dto.CreateRequestRide{
		PassengerID: 1,

		Pickup: dto.Location{
			Latitude:  req.Pickup.Latitude,
			Longitude: req.Pickup.Longitude,
			Address:   req.Pickup.Address,
		},

		Destination: dto.Location{
			Latitude:  req.Destination.Latitude,
			Longitude: req.Destination.Longitude,
			Address:   req.Destination.Address,
		},

		VehicleType: req.VehicleType,
	}

	ride, err := h.svc.CreateRide(ctx, createReq)
	if err != nil {
		return nil, err
	}

	response := &pb.RideResponse{
		Ride: &pb.Ride{
			Id:                int64(ride.ID),
			PassengerId:       int64(ride.PassengerID),
			Status:            ride.Status,
			EstimatedDistance: ride.EstimatedDistance,
			EstimatedDuration: int32(ride.EstimatedDuration),

			Pickup: &pb.Location{
				Latitude:  ride.PickupLatitude,
				Longitude: ride.PickupLongitude,
			},

			Destination: &pb.Location{
				Latitude:  ride.DropoffLatitude,
				Longitude: ride.DropoffLongitude,
			},

			RequestedAt: ride.RequestedAt.Format(time.RFC3339),
			CreatedAt:   ride.CreatedAt.Format(time.RFC3339),
			UpdatedAt:   ride.UpdatedAt.Format(time.RFC3339),
		},
	}

	if ride.DriverID != nil {
		driverID := int64(*ride.DriverID)

		response.Ride.DriverId = &driverID
	}

	if ride.DriverAssignedAt != nil {
		response.Ride.DriverAssignedAt =
			ride.DriverAssignedAt.Format(time.RFC3339)
	}

	if ride.DriverArrivedAt != nil {
		response.Ride.DriverArrivedAt =
			ride.DriverArrivedAt.Format(time.RFC3339)
	}

	if ride.StartedAt != nil {
		response.Ride.StartedAt =
			ride.StartedAt.Format(time.RFC3339)
	}

	if ride.CompletedAt != nil {
		response.Ride.CompletedAt =
			ride.CompletedAt.Format(time.RFC3339)
	}

	if ride.CancelledAt != nil {
		response.Ride.CancelledAt =
			ride.CancelledAt.Format(time.RFC3339)
	}

	return response, nil
}
