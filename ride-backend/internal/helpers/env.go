package helpers

import (
	"os"
	"strings"
)

func GetEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func NormalizePEM(value string) string {
	return strings.ReplaceAll(value, `\n`, "\n")
}
