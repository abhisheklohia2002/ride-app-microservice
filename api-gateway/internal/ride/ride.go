package ride

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

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
	PassengerID int64  `json:"passengerId"`
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
			PassengerID: req.PassengerID,
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

func AcceptRide(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPost {
		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	rideIDValue := r.PathValue("rideId")

	rideID, err := strconv.ParseInt(
		rideIDValue,
		10,
		64,
	)
	if err != nil {
		http.Error(
			w,
			"invalid ride id",
			http.StatusBadRequest,
		)
		return
	}

	var req struct {
		DriverID uint64 `json:"driverId"`
	}

	if err := json.NewDecoder(
		r.Body,
	).Decode(&req); err != nil {
		http.Error(
			w,
			"invalid request body",
			http.StatusBadRequest,
		)
		return
	}

	if req.DriverID == 0 {
		http.Error(
			w,
			"driver id is required",
			http.StatusBadRequest,
		)
		return
	}

	res, err :=
		grpcRideClient.RideClient.AcceptRide(
			r.Context(),
			&pb.AcceptRideRequest{
				RideId:   rideID,
				DriverId: req.DriverID,
			},
		)

	if err != nil {
		http.Error(
			w,
			"failed to accept ride",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	_ = json.NewEncoder(w).Encode(
		map[string]any{
			"message": "ride accepted",
			"data":    res,
		},
	)
}

func CancelRide(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPost {
		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	rideID, err := strconv.ParseInt(
		r.PathValue("rideId"),
		10,
		64,
	)
	if err != nil {
		http.Error(
			w,
			"invalid ride id",
			http.StatusBadRequest,
		)
		return
	}

	var body struct {
		CancelledBy string `json:"cancelledBy"`
	}

	if err := json.NewDecoder(
		r.Body,
	).Decode(&body); err != nil {
		http.Error(
			w,
			"invalid request body",
			http.StatusBadRequest,
		)
		return
	}

	if body.CancelledBy == "" {
		http.Error(
			w,
			"cancelledBy is required",
			http.StatusBadRequest,
		)
		return
	}

	res, err :=
		grpcRideClient.RideClient.CancelRide(
			r.Context(),
			&pb.CancelRideRequest{
				RideId:      rideID,
				CancelledBy: body.CancelledBy,
			},
		)

	if err != nil {
		http.Error(
			w,
			"failed to cancel ride",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	_ = json.NewEncoder(w).Encode(
		map[string]any{
			"message": "ride cancelled",
			"data":    res,
		},
	)
}
