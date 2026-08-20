package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/ride-app/internal/handlers/users"
	"github.com/ride-app/internal/handlers/vehicle"
	middleware "github.com/ride-app/internal/middleware"
)

func Routes(router *gin.Engine, userhandler users.UserHandlerImpl, vehicleHandler vehicle.Vehicle) {
	api := router.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/register", userhandler.Register)
		auth.POST("/login", userhandler.Login)
		auth.POST("/logout", userhandler.Logout)
		auth.POST("/refresh", userhandler.Refresh)
	}

	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/auth/me", userhandler.Self)
	}

	vehicle := api.Group("/vehicle")
	{
		vehicle.POST("/", vehicleHandler.Create)
		vehicle.GET("/", vehicleHandler.GetAll)
		vehicle.GET("/:id", vehicleHandler.GetByID)
		vehicle.PUT("/:id", vehicleHandler.Update)
		vehicle.DELETE("/:id", vehicleHandler.Delete)

	}
}
