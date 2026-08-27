package main

import (
	"context"
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/ride-app/ride-matching-service/internal/config"
	"github.com/ride-app/ride-matching-service/internal/consumers"
	"github.com/ride-app/ride-matching-service/internal/handlers"
	"github.com/ride-app/ride-matching-service/internal/messaging/rabbitmq"
	"github.com/ride-app/ride-matching-service/internal/redis"
	"github.com/ride-app/ride-matching-service/internal/repository"
	"github.com/ride-app/ride-matching-service/internal/services"
	matchingWebSocket "github.com/ride-app/ride-matching-service/internal/websocket"
	// "github.com/ride-app/shared/messaging/rabbitmq"
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

	ctx := context.Background()

	rabbitConsumer, err := rabbitmq.NewConsumer(
		cfg.RABBITMQ_URL,
	)
	if err != nil {
		log.Fatalf(
			"failed to connect RabbitMQ: %v",
			err,
		)
	}
	defer rabbitConsumer.Close()

	redisClient, err := redis.NewClient(
		cfg.REDIS_ADDR,
	)
	if err != nil {
		log.Fatalf(
			"failed to connect Redis: %v",
			err,
		)
	}

	defer redisClient.Close()
	pendingRideStore :=
		services.NewPendingRideStore()
	offerStore := services.NewRideOfferStore()

	driverLocationRepo := repository.NewDriverLocationRepository(
		redisClient.RDB,
	)

	rabbitPublisher, err :=
		rabbitmq.NewPublisher(
			rabbitConsumer.Connection(),
		)

	if err != nil {
		log.Fatalf(
			"failed to create RabbitMQ publisher: %v",
			err,
		)
	}

	defer rabbitPublisher.Close()
	matchingService := services.NewMatchingService(
		driverLocationRepo,
		rabbitPublisher,
		pendingRideStore,
		offerStore,
	)

	passengerHub := matchingWebSocket.NewHub()
	activeRideStore := services.NewActiveRideStore()
	driverConsumer := consumers.NewDriverConsumer(
		rabbitConsumer,
		matchingService,
		passengerHub,
		activeRideStore,
	)

	if err := driverConsumer.Start(ctx); err != nil {
		log.Fatalf(
			"failed to start driver consumer: %v",
			err,
		)
	}

	rideConsumer := consumers.NewRideConsumer(
		rabbitConsumer,
		matchingService,
		passengerHub,
		activeRideStore,
		pendingRideStore,
	)

	if err := rideConsumer.Start(ctx); err != nil {
		log.Fatalf(
			"failed to start ride consumer: %v",
			err,
		)
	}

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			cfg.CLIENT_URL, "http://localhost:5173",
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

	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return

			case <-ticker.C:
				matchingService.RetryPendingRides(ctx)
			}
		}
	}()
	r.GET("/health-matching-service", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	r.GET(
		"/ws/passenger",
		handlers.PassengerSocket(passengerHub),
	)

	log.Println("Matching Service HTTP server running on :8085")
	log.Println("Driver location consumer started")
	log.Println("Ride searching consumer started")

	if err := r.Run(":8085"); err != nil {
		log.Fatalf(
			"matching service failed: %v",
			err,
		)
	}
}
