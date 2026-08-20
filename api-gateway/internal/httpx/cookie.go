package httpx

import "net/http"

type CookieConfig struct {
	AccessMaxAge  int
	RefreshMaxAge int
	Secure        bool
	SameSite      http.SameSite
}

func SetAuthCookies(
	w http.ResponseWriter,
	accessToken string,
	refreshToken string,
	config CookieConfig,
) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HttpOnly: true,
		Secure:   config.Secure,
		SameSite: config.SameSite,
		Path:     "/",
		MaxAge:   config.AccessMaxAge,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   config.Secure,
		SameSite: config.SameSite,
		Path:     "/",
		MaxAge:   config.RefreshMaxAge,
	})
}
