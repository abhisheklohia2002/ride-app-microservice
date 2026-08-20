package auth

import (
	"net/http"
)

func AuthMiddleware(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		token, err := extractToken(r)
		if err != nil {
			http.Error(w, "access token required", http.StatusUnauthorized)
			return
		}

		claims, err := Verify(token)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		ctx := WithClaims(r.Context(), claims)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
