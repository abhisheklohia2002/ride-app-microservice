package dto

type CreateDriverRequest struct {
	FullName string `json:"full_name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Phone    int64  `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"required"`
}

type DriverResponse struct {
	FullName string `json:"full_name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Phone    int64  `json:"phone" binding:"required"`
	Role     string `json:"role" binding:"required"`
}
