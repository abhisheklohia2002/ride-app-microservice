package vehicle

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ride-app/ride-driver-service/internal/dto"
	pb "github.com/ride-app/shared/pkg/driver"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	vehicle "github.com/ride-app/ride-driver-service/internal/services/vehicle"
)

// type Vehicle interface {
// 	Create(c *gin.Context)
// 	GetAll(c *gin.Context)
// 	GetByID(c *gin.Context)
// 	Update(c *gin.Context)
// 	Delete(c *gin.Context)
// }

type vehicleImpl struct {
	vehicleSvc vehicle.Vehicle
	pb.UnimplementedVehicleServiceServer
}

func NewVehicleHandlers(vehicleSvc vehicle.Vehicle) *vehicleImpl {
	return &vehicleImpl{vehicleSvc: vehicleSvc}
}

func (h *vehicleImpl) Create(ctx context.Context, req *pb.CreateRequestVehicle) (*pb.VehicleResponse, error) {
	userID := req.UserId

	if userID <= 0 {
		return nil, status.Error(
			codes.InvalidArgument,
			"invalid user id",
		)
	}
	createReq := dto.CreateVehicleRequest{
		UserID:      uint(userID),
		FullName:    req.FullName,
		PlateNumber: req.PlateNumber,
		Status:      req.Status,
	}

	result, err := h.vehicleSvc.Create(ctx, createReq)

	if err != nil {
		return nil, err
	}

	return &pb.VehicleResponse{
		Vehicle: &pb.Vehicle{
			Id:          int64(result.ID),
			FullName:    result.FullName,
			PlateNumber: result.PlateNumber,
			Status:      result.Status,
			UserId:      int64(result.UserID),
		},
	}, nil
}

// GET /vehicles
func (h *vehicleImpl) GetAll(c *gin.Context) {
	result, err := h.vehicleSvc.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GET /vehicles/:id
func (h *vehicleImpl) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid vehicle id",
		})
		return
	}

	result, err := h.vehicleSvc.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// PUT /vehicles/:id
func (h *vehicleImpl) Update(ctx context.Context, req *pb.UpdateRequestVehicle) (*pb.VehicleResponse, error) {

	vehicleID, ok := ctx.Value("vehicleID").(int)
	if !ok {
		// invalid or missing userID
	}
	vehicleReq := dto.UpdateVehicleRequest{
		FullName:    &req.FullName,
		PlateNumber: &req.PlateNumber,
		Status:      &req.Status,
		VehicleID:   uint(vehicleID),
	}

	result, err := h.vehicleSvc.Update(ctx, uint(vehicleID), vehicleReq)
	if err != nil {
		return nil, err
	}

	return &pb.VehicleResponse{
		Vehicle: &pb.Vehicle{
			Id:          int64(result.ID),
			FullName:    result.FullName,
			PlateNumber: result.PlateNumber,
			Status:      result.Status,
			UserId:      int64(result.UserID),
		},
	}, nil
}

// DELETE /vehicles/:id
func (h *vehicleImpl) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid vehicle id",
		})
		return
	}

	if err := h.vehicleSvc.Delete(
		c.Request.Context(),
		uint(id),
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.Status(http.StatusNoContent)

}
