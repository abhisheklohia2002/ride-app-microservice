package repository

import (
	"context"
	"errors"

	"github.com/ride-app/internal/models"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) (*models.User, error)
	FindByEmail(email string) (*models.User, error)
	FindByID(id uint64) (*models.User, error)
	SearchUsers(query string, excludeUserID uint) ([]models.User, error)
	UpdateUserById(id uint) (*models.User, error)
}

type UserRepositoryImpl struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &UserRepositoryImpl{
		db: db,
	}
}

func (r *UserRepositoryImpl) Create(ctx context.Context, user *models.User) (*models.User, error) {
	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (r *UserRepositoryImpl) FindByEmail(email string) (*models.User, error) {
	var user models.User

	err := r.db.
		Where("email = ?", email).
		First(&user).
		Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}

		return nil, err
	}

	return &user, nil
}

func (r *UserRepositoryImpl) FindByID(id uint64) (*models.User, error) {
	var user models.User

	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepositoryImpl) SearchUsers(query string, excludeUserID uint) ([]models.User, error) {
	var users []models.User

	search := "%" + query + "%"

	err := r.db.
		Where("id <> ? AND (LOWER(full_name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))", excludeUserID, search, search).
		Limit(10).
		Find(&users).
		Error

	return users, err
}

func (r *UserRepositoryImpl) UpdateUserById(userId uint) (*models.User, error) {
	var user models.User

	if err := r.db.First(&user, userId).Error; err != nil {
		return nil, err
	}

	if err := r.db.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}
