package driver

import (
	"encoding/json"
	"net/http"

	pb "github.com/ride-app/shared/pkg/driver"

	"github.com/ride-api-gateway/internal/driver/dto"
	grpcDriverClient "github.com/ride-api-gateway/internal/grpc/driver"
	"github.com/ride-api-gateway/internal/httpx"
)

const accessMaxAge = 60 * 60
const refreshMaxAge = 60 * 60 * 24 * 365

func HandleCreateDriver(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateDriverRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Error(
			w,
			http.StatusBadRequest,
			"Invalid request payload",
			string(http.StatusBadRequest),
		)
		return
	}

	resp, err := grpcDriverClient.DriverClient.Register(
		r.Context(),
		&pb.CreateRequestDriver{
			Fullname: req.FullName,
			Email:    req.Email,
			Phone:    req.Phone,
			Password: req.FullName,
			Role:     "DRIVER",
		},
	)

	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error(), string(http.StatusBadRequest))
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    resp.AccessToken,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		MaxAge:   accessMaxAge,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    resp.RefreshToken,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		MaxAge:   refreshMaxAge,
	})

	clientResp := &dto.DriverResponse{
		FullName: resp.Diver.Fullname,
		Email:    resp.Diver.Email,
		Phone:    resp.Diver.Phone,
		Role:     resp.Diver.Role,
	}

	json.NewEncoder(w).Encode(clientResp)
}
