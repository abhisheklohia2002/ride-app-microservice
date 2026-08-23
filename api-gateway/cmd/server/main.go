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

	err := auth.LoadJWKS(jwksURL)

	if err != nil {
		log.Fatal(err)
	}

	mux.HandleFunc("POST /auth/register", driver.HandleCreateDriver)
	mux.HandleFunc("GET /login/driver", driver.HandlerLoginDriver)
	mux.Handle("GET /self", auth.AuthMiddleware(
		http.HandlerFunc(driver.HandleDriverSelf),
	))
	mux.HandleFunc("POST /logout", driver.HandleDriverLogout)
	mux.HandleFunc("GET /refresh", driver.HandleDriverRefresh)

	//vehicle

	mux.HandleFunc("POST /vehicle/{userId}", driver.HandlerCreateVehicle)

	mux.HandleFunc(
		"/api/rides",
		ride.CreateRide,
	)

	mux.HandleFunc(
		"/api/driver/location",
		driver.UpdateLocation,
	)
	log.Println("api gateway is Running at: 8080 http:localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
