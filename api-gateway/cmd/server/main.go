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
	jwksURL := "http://localhost:8081/.well-known/jwks.json"

	err := auth.LoadJWKS(jwksURL)

	if err != nil {
		log.Fatal(err)
	}

	mux.HandleFunc("POST /register/driver", driver.HandleCreateDriver)
	mux.HandleFunc("GET /login/driver", driver.HandlerLoginDriver)
	mux.Handle("GET /self", auth.AuthMiddleware(
		http.HandlerFunc(driver.HandleDriverSelf),
	))
	mux.HandleFunc("POST /logout", driver.HandleDriverLogout)
	mux.HandleFunc("GET /refresh", driver.HandleDriverRefresh)
	log.Println("api gateway is Running at: 8080 http:localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
