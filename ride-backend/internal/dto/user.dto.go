package dto

type RegisterUserRequest struct {
	FullName string `json:"fullname" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password"`
	Phone    string `json:"phone" binding:"required,min=10"`
	Role     string `json:"role" binding:"required,min=8"`
}

type UpdateUserDto struct {
	FullName string `json:"full_name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=10"`
	Phone    string `json:"phone" binding:"required,min=10"`
}

type AuthUserResponse struct {
	ID       uint   `json:"id"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Phone    string `json:"phone" binding:"required,min=10"`
}

type RegisterUserResponse struct {
	User         AuthUserResponse `json:"user"`
	AccessToken  string           `json:"access_token"`
	RefreshToken string           `json:"refresh_token"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         AuthUserResponse `json:"user"`
	AccessToken  string           `json:"access_token"`
	RefreshToken string           `json:"refresh_token"`
}
