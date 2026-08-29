package main

import (
	"context"
	"log"
	"log/slog"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	pb "github.com/ride-app/shared/pkg/ride"
	"github.com/ride-service/internal/clinets/matching"
	"github.com/ride-service/internal/config"
	"github.com/ride-service/internal/db"
	"github.com/ride-service/internal/handlers"
	"github.com/ride-service/internal/messaging/rabbitmq"
	"github.com/ride-service/internal/models"
	"github.com/ride-service/internal/repository"
	"github.com/ride-service/internal/services"
	"github.com/ride-service/internal/workers"
	"google.golang.org/grpc"
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
		&models.OutboxEvent{},
	); err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}

	r.GET("/health-ride-service", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	publisher, err := rabbitmq.NewPublisher(
		cfg.RABBITMQ_URL,
	)

	if err != nil {
		log.Fatalf(
			"failed to connect RabbitMQ: %v",
			err,
		)
	}

	
	repo := repository.NewRepository(database)
	outboxWorker := workers.NewOutboxWorker(
		repo,
		publisher,
	)
	
	ctx := context.Background()
	
	go outboxWorker.Start(ctx)
	matchingClient, err := matching.NewClient("localhost:5502")
	if err != nil {
		log.Fatalf("failed to Matching listen: %v", err)
	}
	svc := services.NewRideService(repo, matchingClient, *publisher)
	handlers := handlers.NewRideHandlers(svc)
	defer publisher.Close()

	listener, err := net.Listen("tcp", ":5501")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	grpcServer := grpc.NewServer()
	pb.RegisterRideServiceServer(grpcServer, handlers)
	mux := http.NewServeMux()

	go func() {

		log.Println("HTTP Server :8081")

		if err := http.ListenAndServe(
			":8082",
			mux,
		); err != nil {
			log.Fatal(err)
		}

	}()
	log.Println("gRPC Server :5501")
	if err := grpcServer.Serve(listener); err != nil {
		log.Fatal(err)
	}
}
