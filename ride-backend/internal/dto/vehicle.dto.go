package dto

type CreateVehicleRequest struct {
	UserID      uint   `json:"user_id" binding:"required"`
	FullName    string `json:"full_name" binding:"required"`
	PlateNumber string `json:"plate_number" binding:"required"`
	Status      bool   `json:"status"`
}

type UpdateVehicleRequest struct {
	FullName    *string `json:"full_name"`
	PlateNumber *string `json:"plate_number"`
	Status      *bool   `json:"status"`
	VehicleID   uint    `json:"vehicle_id" binding:"required"`
}
