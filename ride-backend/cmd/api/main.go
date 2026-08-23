package main

import (
	"log"
	"log/slog"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/ride-app/ride-driver-service/internal/config"
	dbConnection "github.com/ride-app/ride-driver-service/internal/connection"
	"github.com/ride-app/ride-driver-service/internal/messaging/rabbitmq"
	"github.com/ride-app/ride-driver-service/internal/models"
	refreshRepository "github.com/ride-app/ride-driver-service/internal/repository/refresh_tokens"
	userRepository "github.com/ride-app/ride-driver-service/internal/repository/users"
	vehicleRepository "github.com/ride-app/ride-driver-service/internal/repository/vehicles"
	"github.com/ride-app/ride-driver-service/internal/auth"
	pb "github.com/ride-app/shared/pkg/driver"
	"google.golang.org/grpc"

	userHandles "github.com/ride-app/ride-driver-service/internal/handlers/users"
	vehicleHandles "github.com/ride-app/ride-driver-service/internal/handlers/vehicle"
	tokenService "github.com/ride-app/ride-driver-service/internal/services/token"
	userService "github.com/ride-app/ride-driver-service/internal/services/users"
	vehicleService "github.com/ride-app/ride-driver-service/internal/services/vehicle"
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

	database := dbConnection.ConnectDB(*cfg)

	// CORS
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

	// Database migration
	if err := database.AutoMigrate(
		&models.User{},
		&models.RefreshToken{},
		&models.Vehicle{},
	); err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	rabbitPublisher, err := rabbitmq.NewPublisher(
		cfg.RABBITMQ_URL,
	)
	if err != nil {
		log.Fatalf(
			"failed to connect RabbitMQ: %v",
			err,
		)
	}

	defer rabbitPublisher.Close()
	// JWT
	privateKey, err := auth.LoadRSAPrivateKeyFromEnv("JWT_PRIVATE_KEY")
	if err != nil {
		log.Fatalf("Failed to load private key: %v", err)
	}

	// Repositories
	userRepo := userRepository.NewUserRepository(database)

	refreshRepo := refreshRepository.NewRefreshTokenRepository(database)
	vehicleRepo := vehicleRepository.NewVehicleRepository(database)

	// Services
	tokenSvc := tokenService.NewTokenService(
		privateKey,
		cfg.JWT_ISSUER,
		cfg.JWT_KID,
	)

	userSvc := userService.NewUserService(
		userRepo,
		tokenSvc,
		refreshRepo,
		rabbitPublisher,
	)

	vehicleSvc := vehicleService.NewVehicleService(vehicleRepo)

	// Handlers
	userHandler := userHandles.NewUserHandler(userSvc)
	vehicleHandler := vehicleHandles.NewVehicleHandlers(vehicleSvc)

	listener, err := net.Listen("tcp", ":5500")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterDriverServiceServer(grpcServer, userHandler)
	pb.RegisterVehicleServiceServer(grpcServer, vehicleHandler)
	mux := http.NewServeMux()

	jwksPath := os.Getenv("JWKS_FILE_PATH")

	if jwksPath == "" {
		log.Fatal("JWKS_FILE_PATH is not configured")
	}

	mux.HandleFunc("/.well-known/jwks.json", func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Content-Type", "application/json")

		http.ServeFile(w, r, jwksPath)
	})

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	go func() {

		log.Println("HTTP Server :8081")

		if err := http.ListenAndServe(
			":8081",
			mux,
		); err != nil {
			log.Fatal(err)
		}

	}()
	log.Println("gRPC Server :5500")

	if err := grpcServer.Serve(listener); err != nil {
		log.Fatal(err)
	}
}
