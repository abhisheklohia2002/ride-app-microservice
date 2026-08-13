package helpers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetAuthCookies(c *gin.Context, accessToken string, refreshToken string) {
	accessMaxAge := 60 * 60
	refreshMaxAge := 60 * 60 * 24 * 365

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		MaxAge:   accessMaxAge,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		MaxAge:   refreshMaxAge,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})
}

// func SetAuthCookies(c *gin.Context, accessToken string, refreshToken string) {
// 	accessMaxAge := 60 * 60
// 	refreshMaxAge := 60 * 60 * 24 * 365

// 	// envFile := ".env"

// 	sameSite := http.SameSiteLaxMode
// 	// if isProduction {
// 	// 	sameSite = http.SameSiteNoneMode
// 	// }

// 	http.SetCookie(c.Writer, &http.Cookie{
// 		Name:     "access_token",
// 		Value:    accessToken,
// 		Path:     "/",
// 		MaxAge:   accessMaxAge,
// 		HttpOnly: true,
// 		Secure:   false,
// 		SameSite: sameSite,
// 	})

// 	http.SetCookie(c.Writer, &http.Cookie{
// 		Name:     "refresh_token",
// 		Value:    refreshToken,
// 		Path:     "/",
// 		MaxAge:   refreshMaxAge,
// 		HttpOnly: true,
// 		Secure:   false,
// 		SameSite: sameSite,
// 	})

// }

func RequireUserID(c *gin.Context) (uint, bool) {
	value, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "unauthorized",
		})
		return 0, false
	}

	userID, ok := value.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "invalid user id",
		})
		return 0, false
	}

	return userID, true
}

func ClearAuthCookies(c *gin.Context) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})
}

// func ClearAuthCookies(c *gin.Context) {
// 	// isProduction := os.Getenv("APP_ENV") == "production"

// 	sameSite := http.SameSiteLaxMode
// 	// if isProduction {
// 	// 	sameSite = http.SameSiteNoneMode
// 	// }

// 	c.SetSameSite(http.SameSiteLaxMode)

// 	http.SetCookie(c.Writer, &http.Cookie{
// 		Name:     "access_token",
// 		Value:    "",
// 		Path:     "/",
// 		MaxAge:   -1,
// 		HttpOnly: true,
// 		Secure:   false,
// 		SameSite: sameSite,
// 	})

// 	http.SetCookie(c.Writer, &http.Cookie{
// 		Name:     "refresh_token",
// 		Value:    "",
// 		Path:     "/",
// 		MaxAge:   -1,
// 		HttpOnly: true,
// 		Secure:   false,
// 		SameSite: sameSite,
// 	})
// }
