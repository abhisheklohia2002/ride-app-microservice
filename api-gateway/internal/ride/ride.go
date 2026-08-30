package ride

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	grpcRideClient "github.com/ride-api-gateway/internal/grpc/ride"
	"github.com/ride-api-gateway/internal/httpx"
	pb "github.com/ride-app/shared/pkg/ride"
)

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
		httpx.Error(
			w,
			http.StatusInternalServerError,
			"failed to accept ride",
			"500",
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
		httpx.Error(
			w,
			http.StatusMethodNotAllowed,
			"method not allowed",
			"405",
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
		CancelledBy string  `json:"cancelledBy"`
		DriverID    *uint64 `json:"driverId,omitempty"`
	}

	if err := json.NewDecoder(
		r.Body,
	).Decode(&body); err != nil {
		httpx.Error(
			w,
			http.StatusBadRequest,
			"invalid request body",
			"400",
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
				DriverId:    body.DriverID,
			},
		)

	if err != nil {
		httpx.Error(
			w,
			http.StatusInternalServerError,
			"failed to cancel ride",
			"500",
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

func GetActivePassengerRide(
	w http.ResponseWriter,
	r *http.Request,
) {
	passengerIDString := r.PathValue("passenger")

	passengerID, err := strconv.ParseUint(
		passengerIDString,
		10,
		64,
	)
	if err != nil {
		httpx.Error(
			w,
			http.StatusBadRequest,
			"invalid passenger id",
			"INVALID_REQUEST",
		)
		return
	}

	res, err :=
		grpcRideClient.RideClient.GetActiveRideByPassenger(
			r.Context(),
			&pb.GetActiveRideRequest{
				UserId: passengerID,
			},
		)

	if err != nil {
		httpx.Error(
			w,
			http.StatusBadRequest,
			"Ride is not Found",
			"INVALID_REQUEST",
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	_ = json.NewEncoder(w).Encode(
		map[string]any{
			"data": res,
		},
	)
}

func GetActiveDriverRide(
	w http.ResponseWriter,
	r *http.Request,
) {
	driverIDString := r.PathValue("driverId")

	driverID, err := strconv.ParseUint(
		driverIDString,
		10,
		64,
	)
	if err != nil {
		http.Error(
			w,
			"invalid driver id",
			http.StatusBadRequest,
		)
		return
	}

	res, err :=
		grpcRideClient.RideClient.GetActiveRideByDriver(
			r.Context(),
			&pb.GetActiveRideRequest{
				UserId: driverID,
			},
		)

	if err != nil {
		http.Error(
			w,
			err.Error(),
			http.StatusBadRequest,
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	_ = json.NewEncoder(w).Encode(
		map[string]any{
			"data": res,
		},
	)
}

func CompleteRide(
	w http.ResponseWriter,
	r *http.Request,
) {
	rideIDString := r.PathValue("rideId")

	rideID, err := strconv.ParseInt(
		rideIDString,
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

	res, err :=
		grpcRideClient.RideClient.CompleteRide(
			r.Context(),
			&pb.CompleteRideRequest{
				RideId: rideID,
			},
		)

	if err != nil {
		http.Error(
			w,
			err.Error(),
			http.StatusBadRequest,
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	_ = json.NewEncoder(w).Encode(
		map[string]any{
			"data": res,
		},
	)
}
