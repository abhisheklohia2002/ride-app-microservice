package vehicle

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ride-app/internal/dto"
	vehicle "github.com/ride-app/internal/services/vehicle"
)

type Vehicle interface {
	Create(c *gin.Context)
	GetAll(c *gin.Context)
	GetByID(c *gin.Context)
	Update(c *gin.Context)
	Delete(c *gin.Context)
}

type vehicleImpl struct {
	vehicleSvc vehicle.Vehicle
}

func NewVehicleHandlers(vehicleSvc vehicle.Vehicle) Vehicle {
	return &vehicleImpl{vehicleSvc: vehicleSvc}
}

func (h *vehicleImpl) Create(c *gin.Context) {
	var req dto.CreateVehicleRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	result, err := h.vehicleSvc.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, result)
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
func (h *vehicleImpl) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid vehicle id",
		})
		return
	}

	var req dto.UpdateVehicleRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	result, err := h.vehicleSvc.Update(
		c.Request.Context(),
		uint(id),
		req,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
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
