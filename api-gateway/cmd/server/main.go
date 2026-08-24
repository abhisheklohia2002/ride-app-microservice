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

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if origin == "http://localhost:5173" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set(
				"Access-Control-Allow-Methods",
				"GET, POST, PUT, PATCH, DELETE, OPTIONS",
			)
			w.Header().Set(
				"Access-Control-Allow-Headers",
				"Origin, Content-Type, Accept, Authorization, X-Requested-With, X-Client",
			)
			w.Header().Set(
				"Access-Control-Expose-Headers",
				"Content-Length",
			)
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

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

	handler := corsMiddleware(mux)

	log.Println("API Gateway is running at http://localhost:8080")

	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}
