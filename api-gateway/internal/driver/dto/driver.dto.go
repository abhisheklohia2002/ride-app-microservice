package dto

type CreateDriverRequest struct {
	FullName string `json:"full_name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"required"`
}

type DriverResponse struct {
	FullName string `json:"full_name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone" binding:"required"`
	Role     string `json:"role" binding:"required"`
}

type LoginDriverRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type CreateVehicleRequest struct {
	FullName    string `json:"full_name" binding:"required"`
	PlateNumber string `json:"plate_number" binding:"required"`
	Status      bool   `json:"status"`
}

type VehicleResponse struct {
	UserId      uint   `json:"userID"`
	FullName    string `json:"full_name" binding:"required"`
	PlateNumber string `json:"plate_number" binding:"required"`
	Status      bool   `json:"status"`
}
