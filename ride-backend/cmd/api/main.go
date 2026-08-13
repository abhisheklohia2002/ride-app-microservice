package main

import (
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/ride-app/internal/auth"
	"github.com/ride-app/internal/config"
	db "github.com/ride-app/internal/connection"
	refreshRepository "github.com/ride-app/internal/repository/refresh_tokens"
	userRepository "github.com/ride-app/internal/repository/users"
	"github.com/ride-app/internal/routes"

	tokenService "github.com/ride-app/internal/services/token"
	userService "github.com/ride-app/internal/services/users"

	userHandles "github.com/ride-app/internal/handlers/users"
)

func main() {
	cfg := config.MustLoad()
	r := gin.Default()
	allowedOrigins := []string{"http://localhost:5173"}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true,
		Level:     slog.LevelInfo,
	}))
	slog.SetDefault(logger)
	r.Use(cors.New(cors.Config{
		AllowOrigins: allowedOrigins,
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
		},
		ExposeHeaders: []string{
			"Content-Length",
		},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
	r.StaticFile(
		"/.well-known/jwks.json",
		"./public/.well-known/jwks.json",
	)
	db := db.ConnectDB(*cfg)
	privateKey, _ := auth.LoadRSAPrivateKeyFromEnv("JWT_PRIVATE_KEY")
	userRepo := userRepository.NewUserRepository(db)
	refreshRepo := refreshRepository.NewRefreshTokenRepository(db)
	tokenSvc := tokenService.NewTokenService(privateKey, cfg.JWT_ISSUER, cfg.JWT_KID)
	userSvc := userService.NewUserService(userRepo, tokenSvc, refreshRepo)
	userHandler := userHandles.NewUserHandler(userSvc)

	routes.Routes(r, userHandler)
	r.Run(":" + cfg.PORT)
	if err := r.Run(":" + cfg.PORT); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
