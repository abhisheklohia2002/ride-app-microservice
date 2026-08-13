package users

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ride-app/internal/dto"
	"github.com/ride-app/internal/helpers"
	"github.com/ride-app/internal/services/users"
)

type UserHandler interface {
	Register(c *gin.Context)
	Login(c *gin.Context)
	Self(c *gin.Context)
	Logout(c *gin.Context)
	Refresh(c *gin.Context)
}

type UserHandlerImpl struct {
	service users.UserService
}

func NewUserHandler(service users.UserService) UserHandler {
	return &UserHandlerImpl{
		service: service,
	}
}

func (h *UserHandlerImpl) Register(c *gin.Context) {
	var req dto.RegisterUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid request body",
			"error":   err.Error(),
		})
		return
	}

	res, err := h.service.Register(req)
	if err != nil {
		if err.Error() == "email already exists" {
			c.JSON(http.StatusConflict, gin.H{
				"message": "email already exists",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "failed to register user",
			"error":   err.Error(),
		})
		return
	}

	helpers.SetAuthCookies(c, res.AccessToken, res.RefreshToken)

	c.JSON(http.StatusCreated, gin.H{
		"message": "user registered successfully",
		"data":    res.User,
	})
}

func (h *UserHandlerImpl) Login(c *gin.Context) {
	var req dto.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid request body",
			"error":   err.Error(),
		})
		return
	}

	res, err := h.service.Login(req)
	if err != nil {
		if err.Error() == "invalid email or password" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "invalid email or password",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "failed to login",
			"error":   err.Error(),
		})
		return
	}

	helpers.SetAuthCookies(c, res.AccessToken, res.RefreshToken)

	c.JSON(http.StatusOK, gin.H{
		"message": "login successful",
		"data":    res.User,
	})
}

func (h *UserHandlerImpl) Logout(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err == nil && refreshToken != "" {
		_ = h.service.Logout(refreshToken)
	}

	helpers.ClearAuthCookies(c)

	c.JSON(http.StatusOK, gin.H{
		"message": "logout successful",
	})
}

func (h *UserHandlerImpl) Self(c *gin.Context) {
	userID, ok := helpers.RequireUserID(c)
	if !ok {
		return
	}

	user, err := h.service.Self(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "failed to fetch user",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user fetched successfully",
		"data":    user,
	})
}

func (h *UserHandlerImpl) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		helpers.ClearAuthCookies(c)
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "refresh token cookie is required",
		})
		return
	}

	res, err := h.service.Refresh(refreshToken)
	if err != nil {
		helpers.ClearAuthCookies(c)
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "refresh failed",
			"error":   err.Error(),
		})
		return
	}

	helpers.SetAuthCookies(c, res.AccessToken, res.RefreshToken)

	c.JSON(http.StatusOK, gin.H{
		"message": "token refreshed successfully",
		"data":    res.User,
	})
}
