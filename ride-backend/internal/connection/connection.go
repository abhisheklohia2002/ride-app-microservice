package db

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/ride-app/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func ConnectDB(cfg config.Config) *gorm.DB {
	databaseURL := cfg.DB_URL
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	if databaseURL != "nil" {
		log.Println("connecting to render database")

		database, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
			Logger: newLogger,
		})
		if err != nil {
			log.Fatal("failed to connect render database: ", err)
		}

		return database
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		cfg.DBHOST,
		cfg.DBUSER,
		cfg.DBPASSWORD,
		cfg.DBNAME,
		cfg.DBPORT,
		"disable",
		"Asia/Kolkata",
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect database: ", err)
	}

	log.Println("Database connected successfully")

	return db
}
