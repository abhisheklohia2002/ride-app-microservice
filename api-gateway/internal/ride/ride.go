package ride

import (
	"encoding/json"
	"log"
	"net/http"

	grpcRideClient "github.com/ride-api-gateway/internal/grpc/ride"
	pb "github.com/ride-app/shared/pkg/ride"
)

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
}

func CreateRide(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	var req CreateRideRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(
			w,
			"invalid request body",
			http.StatusBadRequest,
		)
		return
	}

	res, err := grpcRideClient.RideClient.CreateRide(
		r.Context(),
		&pb.CreateRideRequest{
			Pickup: &pb.Location{
				Latitude:  req.Pickup.Latitude,
				Longitude: req.Pickup.Longitude,
				Address:   req.Pickup.Address,
			},
			Destination: &pb.Location{
				Latitude:  req.Destination.Latitude,
				Longitude: req.Destination.Longitude,
				Address:   req.Destination.Address,
			},
			VehicleType: req.VehicleType,
		},
	)

	if err != nil {
		log.Printf("CreateRide gRPC error: %v", err)

		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	w.WriteHeader(http.StatusCreated)

	_ = json.NewEncoder(w).Encode(
		map[string]interface{}{
			"message": "ride created successfully",
			"data":    res,
		},
	)
}
