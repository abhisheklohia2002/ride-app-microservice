package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/ride-app/internal/handlers/users"
)

func Routes(router *gin.Engine, userhandler users.UserHandler) {
	api := router.Group("/api")
	user := api.Group("/auth")
	{
		user.POST("/register", userhandler.Register)
		user.POST("/login", userhandler.Login)
		user.POST("/refresh", userhandler.Refresh)
		user.POST("/logout", userhandler.Logout)
		user.GET("/me", userhandler.Self)

	}
}
