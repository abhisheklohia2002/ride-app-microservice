package users

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/ride-app/internal/dto"
	"github.com/ride-app/internal/models"
	refresh "github.com/ride-app/internal/repository/refresh_tokens"
	repository "github.com/ride-app/internal/repository/users"
	token "github.com/ride-app/internal/services/token"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Register(req dto.RegisterUserRequest) (*dto.RegisterUserResponse, error)
	Login(req dto.LoginRequest) (*dto.AuthResponse, error)
	Self(userID uint) (*dto.AuthUserResponse, error)
	Logout(refreshToken string) error
	Refresh(refreshToken string) (*dto.AuthResponse, error)
	UpdateUser(userID uint) (*dto.AuthUserResponse, error)
}

type UserServiceImpl struct {
	repo             repository.UserRepository
	tokenService     token.TokenService
	refreshTokenRepo refresh.RefreshTokenRepository
}

func NewUserService(
	repo repository.UserRepository,
	tokenService token.TokenService,
	refreshTokenRepo refresh.RefreshTokenRepository,
) UserService {
	return &UserServiceImpl{
		repo:             repo,
		tokenService:     tokenService,
		refreshTokenRepo: refreshTokenRepo,
	}
}

func (s *UserServiceImpl) Register(req dto.RegisterUserRequest) (*dto.RegisterUserResponse, error) {
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

	user := models.User{
		FullName:     fullName,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         req.Role,
		Phone:        req.Phone,
		
	}

	savedUser, err := s.repo.Create(&user)
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

func (s *UserServiceImpl) Login(req dto.LoginRequest) (*dto.AuthResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	accessToken, err := s.tokenService.GenerateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.tokenService.GenerateRefreshToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	errToken := s.refreshTokenRepo.DeleteTokensByUserID(user.ID)
	if errToken != nil {
		return nil, errors.New("failed to Delete refresh token")
	}
	refreshTokenRecord := models.RefreshToken{
		Token:     refreshToken,
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
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *UserServiceImpl) Self(userID uint) (*dto.AuthUserResponse, error) {
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

	user, err := s.repo.FindByID(claims.UserID)
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
