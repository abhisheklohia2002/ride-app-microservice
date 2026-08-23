package services

import "github.com/ride-app/ride-service/internal/repository"

type Service interface {
}

type serviceImpl struct {
	repo repository.Repository
}

func NewRideService(
	repo repository.Repository,
) Service {
	return &serviceImpl{repo: repo}
}
