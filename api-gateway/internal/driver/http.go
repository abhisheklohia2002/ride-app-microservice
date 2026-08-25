package driver

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	pb "github.com/ride-app/shared/pkg/driver"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/emptypb"

	"github.com/ride-api-gateway/internal/auth"
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
			"INVALID_REQUEST",
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
			Role:     req.Role,
		},
	)

	if err != nil {
		httpx.HandleGRPCError(w, err)
		return
	}

	httpx.SetAuthCookies(
		w,
		resp.AccessToken,
		resp.RefreshToken,
		httpx.CookieConfig{
			AccessMaxAge:  accessMaxAge,
			RefreshMaxAge: refreshMaxAge,
			Secure:        true,
			SameSite:      http.SameSiteNoneMode,
		},
	)

	clientResp := &dto.DriverResponse{
		FullName: resp.Diver.Fullname,
		Email:    resp.Diver.Email,
		Phone:    resp.Diver.Phone,
		Role:     resp.Diver.Role,
		ID:       resp.Diver.Id,
	}

	json.NewEncoder(w).Encode(clientResp)
}

func HandlerLoginDriver(w http.ResponseWriter, r *http.Request) {

	var req dto.LoginDriverRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {

		httpx.Error(
			w,
			http.StatusBadRequest,
			"Invalid request payload",
			"INVALID_REQUEST",
		)

		return
	}

	resp, err := grpcDriverClient.DriverClient.Login(r.Context(), &pb.LoginUserRequest{
		Email:    req.Email,
		Password: req.Password,
	})

	if err != nil {
		log.Println(w, err)
		httpx.HandleGRPCError(w, err)
		return
	}
	httpx.SetAuthCookies(
		w,
		resp.AccessToken,
		resp.RefreshToken,
		httpx.CookieConfig{
			AccessMaxAge:  accessMaxAge,
			RefreshMaxAge: refreshMaxAge,
			Secure:        true,
			SameSite:      http.SameSiteNoneMode,
		},
	)

	clientResp := &dto.DriverResponse{
		FullName: resp.Diver.Fullname,
		Email:    resp.Diver.Email,
		Phone:    resp.Diver.Phone,
		Role:     resp.Diver.Role,
		ID:       resp.Diver.Id,
	}

	json.NewEncoder(w).Encode(clientResp)

}

func HandleDriverSelf(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		httpx.Error(
			w,
			http.StatusUnauthorized,
			"unauthorized",
			"INVALID_REQUEST",
		)

		return
	}
	md := metadata.Pairs(
		"user-id", strconv.Itoa(int(claims.UserID)),
		"email", claims.Email,
		"role", claims.Role,
	)

	ctx := metadata.NewOutgoingContext(r.Context(), md)
	resp, err := grpcDriverClient.DriverClient.Self(ctx, &emptypb.Empty{})

	if err != nil {
		httpx.HandleGRPCError(w, err)
		return
	}
	if resp.Id != uint64(claims.UserID) {
		httpx.Error(
			w,
			http.StatusForbidden,
			"forbidden",
			"INVALID_REQUEST",
		)

		return
	}
	json.NewEncoder(w).Encode(resp)
}

func HandleDriverLogout(w http.ResponseWriter, r *http.Request) {

	refreshCookie, err := r.Cookie("refresh_token")
	if err != nil || refreshCookie.Value == "" {
		httpx.Error(
			w,
			http.StatusUnauthorized,
			"Refresh token is required",
			"REFRESH_TOKEN_REQUIRED",
		)
		return
	}

	ctx := metadata.AppendToOutgoingContext(
		r.Context(),
		"refresh_token",
		refreshCookie.Value,
	)

	_, err = grpcDriverClient.DriverClient.Logout(
		ctx,
		&emptypb.Empty{},
	)

	if err != nil {
		httpx.HandleGRPCError(w, err)
		return
	}

	httpx.ClearAuthCookies(w)

	httpx.Success(
		w,
		http.StatusOK,
		"Logout successful",
	)
}

func HandleDriverRefresh(w http.ResponseWriter, r *http.Request) {
	refreshCookie, err := r.Cookie("refresh_token")
	if err != nil || refreshCookie.Value == "" {
		httpx.Error(
			w,
			http.StatusUnauthorized,
			"Refresh token is required",
			"REFRESH_TOKEN_REQUIRED",
		)
		return
	}

	ctx := metadata.AppendToOutgoingContext(
		r.Context(),
		"refresh_token",
		refreshCookie.Value,
	)

	resp, err := grpcDriverClient.DriverClient.Refresh(ctx, &emptypb.Empty{})
	if err != nil {
		httpx.HandleGRPCError(w, err)
		return
	}
	httpx.SetAuthCookies(
		w,
		resp.AccessToken,
		resp.RefreshToken,
		httpx.CookieConfig{
			AccessMaxAge:  accessMaxAge,
			RefreshMaxAge: refreshMaxAge,
			Secure:        true,
			SameSite:      http.SameSiteNoneMode,
		},
	)

	clientResp := &dto.DriverResponse{
		FullName: resp.Diver.Fullname,
		Email:    resp.Diver.Email,
		Phone:    resp.Diver.Phone,
		Role:     resp.Diver.Role,
	}

	json.NewEncoder(w).Encode(clientResp)
}

func UpdateLocation(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPatch {
		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	var req dto.UpdateLocationRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(
			w,
			"invalid request body",
			http.StatusBadRequest,
		)
		return
	}

	if req.Latitude < -90 || req.Latitude > 90 {
		http.Error(
			w,
			"invalid latitude",
			http.StatusBadRequest,
		)
		return
	}

	if req.Longitude < -180 || req.Longitude > 180 {
		http.Error(
			w,
			"invalid longitude",
			http.StatusBadRequest,
		)
		return
	}

	res, err := grpcDriverClient.DriverClient.UpdateLocation(
		r.Context(),
		&pb.UpdateDriverLocationRequest{
			Latitude:  req.Latitude,
			Longitude: req.Longitude,
			DriverId:  uint64(req.DriverId),
		},
	)

	if err != nil {
		http.Error(
			w,
			"failed to update driver location",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	_ = json.NewEncoder(w).Encode(
		map[string]interface{}{
			"message": "driver location updated",
			"data":    res,
		},
	)
}
