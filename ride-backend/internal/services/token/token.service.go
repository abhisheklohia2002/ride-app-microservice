package token

import (
	"crypto/rsa"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/ride-app/ride-driver-service/internal/models"
)

type TokenService interface {
	GenerateAccessToken(user *models.User) (string, error)
	GenerateRefreshToken(user *models.User) (string, error)
	ValidateRefreshToken(tokenString string) (*CustomClaims, error)
}

type TokenServiceImpl struct {
	privateKey *rsa.PrivateKey
	issuer     string
	kid        string
}

type CustomClaims struct {
	UserID    uint   `json:"user_id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	FullName  string `json:"full_name"`
	Phone     string `json:"phone"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

func NewTokenService(privateKey *rsa.PrivateKey, issuer string, kid string) TokenService {
	return &TokenServiceImpl{
		privateKey: privateKey,
		issuer:     issuer,
		kid:        kid,
	}
}

func (s *TokenServiceImpl) GenerateAccessToken(user *models.User) (string, error) {
	now := time.Now()

	claims := CustomClaims{
		UserID:    user.ID,
		Email:     user.Email,
		Role:      user.Role,
		FullName:  user.FullName,
		Phone:     user.Phone,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   fmt.Sprintf("%d", user.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(1 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = s.kid
	token.Header["typ"] = "JWT"

	return token.SignedString(s.privateKey)
}

func (s *TokenServiceImpl) GenerateRefreshToken(user *models.User) (string, error) {
	now := time.Now()

	claims := CustomClaims{
		UserID:    user.ID,
		Email:     user.Email,
		Role:      user.Role,
		FullName:  user.FullName,
		Phone:     user.Phone,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   fmt.Sprintf("%d", user.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.AddDate(1, 0, 0)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = s.kid
	token.Header["typ"] = "JWT"

	return token.SignedString(s.privateKey)
}

func (s *TokenServiceImpl) ValidateRefreshToken(tokenString string) (*CustomClaims, error) {
	claims := &CustomClaims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (any, error) {
			if token.Method.Alg() != jwt.SigningMethodRS256.Alg() {
				return nil, fmt.Errorf("unexpected signing method: %s", token.Method.Alg())
			}

			return &s.privateKey.PublicKey, nil
		},
		jwt.WithIssuer(s.issuer),
	)

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid refresh token")
	}

	if claims.TokenType != "refresh" {
		return nil, fmt.Errorf("invalid token type")
	}

	return claims, nil
}
