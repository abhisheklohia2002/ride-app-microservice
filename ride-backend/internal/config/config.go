package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	PORT    string
	APP_ENV string
	// DATABASE_URL    string
	JWT_KID         string
	JWT_PRIVATE_KEY string
	JWT_ISSUER      string
	JWKS_URL        string
	DB_URL          string
	DBHOST          string
	DBPORT          string
	DBUSER          string
	DBPASSWORD      string
	DBNAME          string
}

func findSecret(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic(fmt.Sprintf("environment variable %q is required", key))
	}

	return value
}

func MustLoad() *Config {
	envFile := os.Getenv("ENV_FILE")

	if envFile == "" {
		envFile = ".env"
	}

	if err := godotenv.Load(envFile); err != nil {
		fmt.Printf("%s not found, using system environment variables\n", envFile)
	}

	return &Config{
		PORT:    findSecret("PORT"),
		APP_ENV: findSecret("APP_ENV"),
		// DATABASE_URL:    findSecret("DATABASE_URL"),
		JWT_KID:         findSecret("JWT_KID"),
		JWT_PRIVATE_KEY: findSecret("JWT_PRIVATE_KEY"),
		JWT_ISSUER:      findSecret("JWT_ISSUER"),
		JWKS_URL:        findSecret("JWKS_URL"),
		DB_URL:          findSecret("DB_URL"),
		DBHOST:          findSecret("DB_HOST"),
		DBPORT:          findSecret("DB_PORT"),
		DBUSER:          findSecret("DB_USERNAME"),
		DBPASSWORD:      findSecret("DB_PASSWORD"),
		DBNAME:          findSecret("DB_NAME"),
	}
}
