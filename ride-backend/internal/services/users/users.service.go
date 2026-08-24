package users

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/ride-app/ride-driver-service/internal/dto"
	"github.com/ride-app/ride-driver-service/internal/events"
	"github.com/ride-app/ride-driver-service/internal/messaging/rabbitmq"
	"github.com/ride-app/ride-driver-service/internal/models"
	refresh "github.com/ride-app/ride-driver-service/internal/repository/refresh_tokens"
	repository "github.com/ride-app/ride-driver-service/internal/repository/users"
	token "github.com/ride-app/ride-driver-service/internal/services/token"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Register(ctx context.Context, req dto.RegisterUserRequest) (*dto.RegisterUserResponse, error)
	Login(ctx context.Context, req dto.LoginRequest) (*dto.AuthResponse, error)
	Self(userID uint64) (*dto.AuthUserResponse, error)
	Logout(refreshToken string) error
	Refresh(refreshToken string) (*dto.AuthResponse, error)
	UpdateUser(userID uint) (*dto.AuthUserResponse, error)
	UpdateDriverLocation(
		ctx context.Context,
		driverID uint64,
		latitude float64,
		longitude float64,
	) error
}

type UserServiceImpl struct {
	repo             repository.UserRepository
	tokenService     token.TokenService
	refreshTokenRepo refresh.RefreshTokenRepository
	publisher        *rabbitmq.Publisher
}

func NewUserService(
	repo repository.UserRepository,
	tokenService token.TokenService,
	refreshTokenRepo refresh.RefreshTokenRepository,
	publisher *rabbitmq.Publisher,
) UserService {
	return &UserServiceImpl{
		repo:             repo,
		tokenService:     tokenService,
		refreshTokenRepo: refreshTokenRepo,
		publisher:        publisher,
	}
}

func (s *UserServiceImpl) Register(ctx context.Context, req dto.RegisterUserRequest) (*dto.RegisterUserResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	fullName := strings.TrimSpace(req.FullName)

	existingUser, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil, err
	}

	if existingUser != nil {
		return nil, errors.New("email already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	testErr := bcrypt.CompareHashAndPassword(
		hashedPassword,
		[]byte(req.Password),
	)

	if testErr != nil {
		log.Printf(
			"IMMEDIATE BCRYPT TEST FAILED: %v",
			testErr,
		)
	} else {
		log.Println("IMMEDIATE BCRYPT TEST SUCCESS")
	}
	user := models.User{
		FullName:     fullName,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         req.Role,
		Phone:        req.Phone,
	}

	savedUser, err := s.repo.Create(ctx, &user)
	if err != nil {
		return nil, errors.New("failed to create user")
	}
	log.Println(savedUser)
	accessToken, err := s.tokenService.GenerateAccessToken(savedUser)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := s.tokenService.GenerateRefreshToken(savedUser)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	refreshTokenRecord := models.RefreshToken{
		Token:     refreshToken,
		UserID:    savedUser.ID,
		ExpiresAt: time.Now().AddDate(1, 0, 0),
	}

	if err := s.refreshTokenRepo.Create(&refreshTokenRecord); err != nil {
		return nil, errors.New("failed to save refresh token")
	}

	response := &dto.RegisterUserResponse{
		User: dto.AuthUserResponse{
			ID:       savedUser.ID,
			FullName: savedUser.FullName,
			Email:    savedUser.Email,
			Role:     savedUser.Role,
			Phone:    savedUser.Phone,
		},
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}

	return response, nil
}

func (s *UserServiceImpl) Login(
	ctx context.Context,
	req dto.LoginRequest,
) (*dto.AuthResponse, error) {

	email := strings.ToLower(
		strings.TrimSpace(req.Email),
	)

	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil, fmt.Errorf(
			"failed to find user: %w",
			err,
		)
	}

	if user == nil {
		return nil, errors.New(
			"invalid email or password",
		)
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	); err != nil {
		return nil, errors.New(
			"invalid email or password",
		)
	}

	accessToken, err := s.tokenService.GenerateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf(
			"failed to generate access token: %w",
			err,
		)
	}

	refreshToken, err := s.tokenService.GenerateRefreshToken(user)
	if err != nil {
		return nil, fmt.Errorf(
			"failed to generate refresh token: %w",
			err,
		)
	}

	if err := s.refreshTokenRepo.DeleteTokensByUserID(
		user.ID,
	); err != nil {
		return nil, errors.New(
			"failed to delete refresh token",
		)
	}
	// log.Fatalln(user.ID)
	refreshTokenRecord := models.RefreshToken{
		Token:     refreshToken,
		UserID:    user.ID,
		ExpiresAt: time.Now().AddDate(1, 0, 0),
	}

	if err := s.refreshTokenRepo.Create(
		&refreshTokenRecord,
	); err != nil {
		return nil, fmt.Errorf(
			"failed to save refresh token: %w",
			err,
		)
	}

	return &dto.AuthResponse{
		User: dto.AuthUserResponse{
			ID:       user.ID,
			FullName: user.FullName,
			Email:    user.Email,
			Role:     user.Role,
			Phone:    user.Phone,
		},
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *UserServiceImpl) Self(userID uint64) (*dto.AuthUserResponse, error) {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	return &dto.AuthUserResponse{
		ID:       user.ID,
		FullName: user.FullName,
		Email:    user.Email,
		Role:     user.Role,
		Phone:    user.Phone,
	}, nil
}

func (s *UserServiceImpl) Logout(refreshToken string) error {
	if strings.TrimSpace(refreshToken) == "" {
		return errors.New("refresh token is required")
	}

	if err := s.refreshTokenRepo.Revoke(refreshToken); err != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", err)
	}

	return nil
}

func (s *UserServiceImpl) Refresh(refreshToken string) (*dto.AuthResponse, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return nil, errors.New("refresh token is required")
	}

	claims, err := s.tokenService.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	storedToken, err := s.refreshTokenRepo.FindByToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to find refresh token: %w", err)
	}

	if storedToken == nil {
		return nil, errors.New("refresh token not found")
	}

	if storedToken.RevokedAt != nil {
		return nil, errors.New("refresh token revoked")
	}

	if time.Now().After(storedToken.ExpiresAt) {
		return nil, errors.New("refresh token expired")
	}

	user, err := s.repo.FindByID(uint64(claims.UserID))
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	if err := s.refreshTokenRepo.Revoke(refreshToken); err != nil {
		return nil, fmt.Errorf("failed to revoke old refresh token: %w", err)
	}

	newAccessToken, err := s.tokenService.GenerateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	newRefreshToken, err := s.tokenService.GenerateRefreshToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	refreshTokenRecord := models.RefreshToken{
		Token:     newRefreshToken,
		UserID:    user.ID,
		ExpiresAt: time.Now().AddDate(1, 0, 0),
	}

	if err := s.refreshTokenRepo.Create(&refreshTokenRecord); err != nil {
		return nil, fmt.Errorf("failed to save refresh token: %w", err)
	}

	return &dto.AuthResponse{
		User: dto.AuthUserResponse{
			ID:       user.ID,
			FullName: user.FullName,
			Email:    user.Email,
			Role:     user.Role,
			Phone:    user.Phone,
		},
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *UserServiceImpl) UpdateUser(userID uint) (*dto.AuthUserResponse, error) {
	user, err := s.repo.UpdateUserById(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	return &dto.AuthUserResponse{
		ID:       user.ID,
		FullName: user.FullName,
		Email:    user.Email,
		Role:     user.Role,
		Phone:    user.Phone,
	}, nil
}

func (s *UserServiceImpl) UpdateDriverLocation(
	ctx context.Context,
	driverID uint64,
	latitude float64,
	longitude float64,
) error {

	event := events.DriverLocationUpdatedEvent{
		DriverID:  driverID,
		Latitude:  latitude,
		Longitude: longitude,
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return s.publisher.Publish(
		"DRIVER_LOCATION_UPDATED",
		payload,
	)
}
