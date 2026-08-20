package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"
)

func WithClaims(ctx context.Context, claims *Claims) context.Context {
	return context.WithValue(ctx, UserContextKey, claims)
}

func UserFromContext(ctx context.Context) (*Claims, bool) {
	claims, ok := ctx.Value(UserContextKey).(*Claims)
	return claims, ok
}

func ClaimsFromContext(ctx context.Context) (*Claims, bool) {

	claims, ok := ctx.Value(UserContextKey).(*Claims)

	return claims, ok
}

func extractToken(r *http.Request) (string, error) {
	if cookie, err := r.Cookie("access_token"); err == nil && cookie.Value != "" {
		return cookie.Value, nil
	}
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", errors.New("access token not found")
	}

	const bearer = "Bearer "

	if !strings.HasPrefix(authHeader, bearer) {
		return "", errors.New("invalid authorization header")
	}

	token := strings.TrimPrefix(authHeader, bearer)

	if token == "" {
		return "", errors.New("empty bearer token")
	}

	return token, nil
}
