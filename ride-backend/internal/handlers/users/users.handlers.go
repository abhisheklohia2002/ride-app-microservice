package users

import (
	"context"
	"strconv"

	"github.com/ride-app/internal/dto"
	"github.com/ride-app/internal/services/users"
	pb "github.com/ride-app/shared/pkg/driver"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type UserHandlerImpl struct {
	service users.UserService
	pb.UnimplementedDriverServiceServer
}

func NewUserHandler(service users.UserService) *UserHandlerImpl {
	return &UserHandlerImpl{
		service: service,
	}
}

func (h *UserHandlerImpl) Register(
	ctx context.Context,
	req *pb.CreateRequestDriver,
) (*pb.UserResponse, error) {

	createReq := dto.RegisterUserRequest{
		FullName: req.Fullname,
		Email:    req.Email,
		Password: req.Password,
		Phone:    req.Phone,
		Role:     req.Role,
	}

	res, err := h.service.Register(ctx, createReq)
	if err != nil {
		return nil, err
	}

	return &pb.UserResponse{
		Diver: &pb.Driver{
			Id:       int64(res.User.ID),
			Fullname: res.User.FullName,
			Email:    res.User.Email,
			Phone:    res.User.Phone,
			Role:     res.User.Role,
		},
		AccessToken:  res.AccessToken,
		RefreshToken: res.RefreshToken,
	}, nil
}

func (h *UserHandlerImpl) Login(ctx context.Context, req *pb.LoginUserRequest) (*pb.UserResponse, error) {

	createReq := dto.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	}

	res, err := h.service.Login(ctx, createReq)

	if err != nil {
		return nil, err
	}

	return &pb.UserResponse{
		Diver: &pb.Driver{
			Id:       int64(res.User.ID),
			Fullname: res.User.FullName,
			Email:    res.User.Email,
			Phone:    res.User.Phone,
			Role:     res.User.Role,
		},
		AccessToken:  res.AccessToken,
		RefreshToken: res.RefreshToken,
	}, nil
}

func (h *UserHandlerImpl) Logout(
	ctx context.Context,
	req *emptypb.Empty,
) (*emptypb.Empty, error) {

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(
			codes.Unauthenticated,
			"authentication metadata is missing",
		)
	}

	refreshTokens := md.Get("refresh_token")

	if len(refreshTokens) == 0 || refreshTokens[0] == "" {
		return nil, status.Error(
			codes.Unauthenticated,
			"refresh token is required",
		)
	}

	if err := h.service.Logout(refreshTokens[0]); err != nil {
		return nil, status.Error(
			codes.Internal,
			"failed to logout user",
		)
	}

	return &emptypb.Empty{}, nil
}

func (h *UserHandlerImpl) Self(ctx context.Context, req *emptypb.Empty) (*pb.UserSelfResponse, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "metadata missing")
	}

	userIDs := md.Get("user-id")
	if len(userIDs) == 0 {
		return nil, status.Error(codes.Unauthenticated, "user id missing")
	}

	userID, err := strconv.ParseUint(userIDs[0], 10, 64)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}

	user, err := h.service.Self(userID)
	if err != nil {
		return nil, err
	}

	return &pb.UserSelfResponse{
		Id:       uint64(user.ID),
		Fullname: user.FullName,
		Email:    user.Email,
		Phone:    user.Phone,
		Role:     user.Role,
	}, nil

}

func (h *UserHandlerImpl) Refresh(
	ctx context.Context,
	req *emptypb.Empty,
) (*pb.UserResponse, error) {

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(
			codes.Unauthenticated,
			"authentication metadata is missing",
		)
	}

	refreshTokens := md.Get("refresh_token")

	if len(refreshTokens) == 0 || refreshTokens[0] == "" {
		return nil, status.Error(
			codes.Unauthenticated,
			"refresh token is required",
		)
	}

	res, err := h.service.Refresh(refreshTokens[0])
	if err != nil {
		return nil, status.Error(
			codes.Unauthenticated,
			"invalid or expired refresh token",
		)
	}

	return &pb.UserResponse{
		Diver: &pb.Driver{
			Id:       int64(res.User.ID),
			Fullname: res.User.FullName,
			Email:    res.User.Email,
			Phone:    res.User.Phone,
			Role:     res.User.Role,
		},
		AccessToken:  res.AccessToken,
		RefreshToken: res.RefreshToken,
	}, nil
}
