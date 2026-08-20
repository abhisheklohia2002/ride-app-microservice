package main

import (
	"log"
	"log/slog"
	"net/http"
	"os"

	"github.com/ride-api-gateway/internal/auth"
	driver "github.com/ride-api-gateway/internal/driver"
	grpcDriverClient "github.com/ride-api-gateway/internal/grpc/driver"
)

func main() {
	grpcDriverClient.InitDriverClient()
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
	jwksURL := "http://user-service:8081/.well-known/jwks.json"

	err := auth.LoadJWKS(jwksURL)

	if err != nil {
		log.Fatal(err)
	}

	mux.HandleFunc("POST /register/driver", driver.HandleCreateDriver)
	mux.HandleFunc("GET /login/driver", driver.HandlerLoginDriver)
	mux.Handle("GET /api/self", auth.AuthMiddleware(
		http.HandlerFunc(driver.HandleDriverSelf),
	))
	log.Fatal(http.ListenAndServe(":8080", mux))

}
