package main

import (
	"log"
	"log/slog"
	"net/http"
	"os"

	"github.com/ride-api-gateway/internal/auth"
	driver "github.com/ride-api-gateway/internal/driver"
	grpcDriverClient "github.com/ride-api-gateway/internal/grpc/driver"
	grpcRideClient "github.com/ride-api-gateway/internal/grpc/ride"
	"github.com/ride-api-gateway/internal/middleware"
	"github.com/ride-api-gateway/internal/ride"
)

func main() {
	grpcDriverClient.InitDriverClient()
	grpcRideClient.InitRideClient()

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

	mux := http.NewServeMux()

	jwksURL := "http://localhost:8081/.well-known/jwks.json"

	if err := auth.LoadJWKS(jwksURL); err != nil {
		log.Fatal(err)
	}

	mux.HandleFunc(
		"POST /api/auth/register",
		driver.HandleCreateDriver,
	)

	mux.HandleFunc(
		"POST /api/auth/login",
		driver.HandlerLoginDriver,
	)

	mux.Handle(
		"GET /self",
		auth.AuthMiddleware(
			http.HandlerFunc(driver.HandleDriverSelf),
		),
	)

	mux.HandleFunc(
		"POST /logout",
		driver.HandleDriverLogout,
	)

	mux.HandleFunc(
		"GET /refresh",
		driver.HandleDriverRefresh,
	)

	mux.HandleFunc(
		"POST /vehicle/{userId}",
		driver.HandlerCreateVehicle,
	)

	mux.HandleFunc(
		"POST /api/rides",
		ride.CreateRide,
	)

	mux.HandleFunc(
		"PATCH /api/driver/location",
		driver.UpdateLocation,
	)
	mux.HandleFunc(
		"POST /api/rides/{rideId}/accept",
		ride.AcceptRide,
	)

	mux.HandleFunc(
		"POST /api/rides/{rideId}/cancel",
		ride.CancelRide,
	)
	handler := middleware.CorsMiddleware(mux)

	log.Println("API Gateway is running at http://localhost:8080")

	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}
