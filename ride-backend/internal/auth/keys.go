package auth

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"strings"
)

func LoadRSAPrivateKeyFromEnv(envKey string) (*rsa.PrivateKey, error) {
	privateKeyPEM := os.Getenv(envKey)
	if privateKeyPEM == "" {
		return nil, fmt.Errorf("%s is empty", envKey)
	}
	privateKeyPEM = strings.ReplaceAll(privateKeyPEM, `\n`, "\n")

	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return nil, fmt.Errorf("failed to decode private key PEM")
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err == nil {
		return privateKey, nil
	}
	parsedKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	rsaPrivateKey, ok := parsedKey.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("private key is not RSA")
	}

	return rsaPrivateKey, nil
}
