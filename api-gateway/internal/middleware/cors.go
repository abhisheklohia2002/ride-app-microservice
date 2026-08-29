package middleware

import "net/http"

func CorsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		origin := r.Header.Get("Origin")

		allowedOrigins := map[string]bool{
			"http://localhost:5173": true,
			"*":                     true,
		}

		if allowedOrigins[origin] {
			w.Header().Set(
				"Access-Control-Allow-Origin",
				origin,
			)

			w.Header().Set(
				"Access-Control-Allow-Credentials",
				"true",
			)

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

			w.Header().Set(
				"Vary",
				"Origin",
			)
		}

		if r.Method == http.MethodOptions {

			if !allowedOrigins[origin] {
				http.Error(
					w,
					"CORS origin not allowed",
					http.StatusForbidden,
				)

				return
			}

			w.WriteHeader(
				http.StatusNoContent,
			)

			return
		}

		next.ServeHTTP(w, r)
	})
}
