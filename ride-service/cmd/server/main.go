package main

import (
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/ride-app/ride-service/internal/config"
	"github.com/ride-app/ride-service/internal/db"
	"github.com/ride-app/ride-service/internal/models"
)

func main() {
	cfg := config.MustLoad()
	logger := slog.New(
		slog.NewJSONHandler(
			os.Stdout,
			&slog.HandlerOptions{
				AddSource: true,
				Level:     slog.LevelInfo,
			},
		),
	)

	slog.SetDefault(logger)

	r := gin.Default()
	database := db.ConnectDB(*cfg)
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			cfg.CLIENT_URL,
		},

		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		},

		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
			"X-Requested-With",
			"X-Client",
		},

		ExposeHeaders: []string{
			"Content-Length",
		},

		AllowCredentials: true,

		MaxAge: 12 * time.Hour,
	}))

	if err := database.AutoMigrate(
		&models.Ride{},
		&models.RideFare{},
		&models.RideStatusHistory{},
	); err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}

	r.GET("/health-ride-service", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	log.Println("gRPC Server :5501")
	r.Run(":5501")
}
