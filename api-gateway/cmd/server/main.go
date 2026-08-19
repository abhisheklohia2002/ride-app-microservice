package main

import (
	"log"
	"log/slog"
	"net/http"
	"os"

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

	log.Fatal(http.ListenAndServe(":8080", mux))

}
