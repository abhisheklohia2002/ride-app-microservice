package driver

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ride-api-gateway/internal/driver/dto"
	grpcDriverClient "github.com/ride-api-gateway/internal/grpc/driver"
	"github.com/ride-api-gateway/internal/httpx"
	pb "github.com/ride-app/shared/pkg/driver"
)

func HandlerCreateVehicle(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("userId")

	if userIDStr == "" {
		httpx.Error(
			w,
			http.StatusBadRequest,
			"UserId is empty",
			"INVALID_REQUEST",
		)
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		httpx.Error(
			w,
			http.StatusBadRequest,
			"Invalid UserId",
			"INVALID_REQUEST",
		)
		return
	}
	var req dto.CreateVehicleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Error(
			w,
			http.StatusBadRequest,
			"Invalid request payload",
			"INVALID_REQUEST",
		)

		return
	}
	resp, err := grpcDriverClient.VehicleClient.Create(r.Context(), &pb.CreateRequestVehicle{
		UserId:      userID,
		FullName:    req.FullName,
		PlateNumber: req.PlateNumber,
		Status:      req.Status,
	})

	if err != nil {
		httpx.HandleGRPCError(w, err)
		return
	}
	clientResp := &dto.VehicleResponse{
		UserId:      uint(resp.Vehicle.UserId),
		FullName:    resp.Vehicle.FullName,
		PlateNumber: resp.Vehicle.PlateNumber,
		Status:      resp.Vehicle.Status,
	}

	json.NewEncoder(w).Encode(clientResp)
}
