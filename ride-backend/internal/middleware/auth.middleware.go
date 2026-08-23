package middlware

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/ride-app/ride-driver-service/internal/auth"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ride-app/ride-driver-service/internal/helpers"
)

type AuthClaims struct {
	UserID    uint   `json:"user_id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		accessToken, err := c.Cookie("access_token")
		if err != nil || accessToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "access token cookie is required",
			})
			c.Abort()
			return
		}

		claims := &AuthClaims{}

		token, err := jwt.ParseWithClaims(
			accessToken,
			claims,
			func(token *jwt.Token) (any, error) {
				if token.Method.Alg() != jwt.SigningMethodRS256.Alg() {
					return nil, fmt.Errorf("unexpected signing method: %s", token.Method.Alg())
				}

				kid, ok := token.Header["kid"].(string)
				if !ok || kid == "" {
					return nil, errors.New("kid missing in token header")
				}

				return auth.GetPublicKeyFromJWKS(kid)
			},
			jwt.WithIssuer(helpers.GetEnv("JWT_ISSUER", "flowboard-api")),
		)

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "invalid or expired access token",
				"error":   err.Error(),
			})
			c.Abort()
			return
		}

		if !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "invalid access token",
			})
			c.Abort()
			return
		}

		if claims.TokenType != "access" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "invalid token type",
			})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		c.Next()
	}
}
