package auth

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"sync"
	"time"
)

type JWK struct {
	Kty string `json:"kty"`
	Use string `json:"use"`
	Kid string `json:"kid"`
	Alg string `json:"alg"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type JWKS struct {
	Keys []JWK `json:"keys"`
}

var (
	jwksCache      *JWKS
	jwksCacheUntil time.Time
	jwksMu         sync.Mutex
)

func GetPublicKeyFromJWKS(kid string) (any, error) {
	jwks, err := fetchJWKS()
	if err != nil {
		return nil, err
	}

	for _, key := range jwks.Keys {
		if key.Kid == kid {
			return jwkToRSAPublicKey(key)
		}
	}

	return nil, fmt.Errorf("matching public key not found for kid: %s", kid)
}

func fetchJWKS() (*JWKS, error) {
	jwksMu.Lock()
	defer jwksMu.Unlock()

	if jwksCache != nil && time.Now().Before(jwksCacheUntil) {
		return jwksCache, nil
	}

	jwksURL := os.Getenv("JWKS_URL")
	if jwksURL == "" {
		return nil, errors.New("JWKS_URL is empty")
	}

	client := http.Client{
		Timeout: 5 * time.Second,
	}

	resp, err := client.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch jwks: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jwks endpoint returned status: %d", resp.StatusCode)
	}

	var jwks JWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("failed to decode jwks: %w", err)
	}

	jwksCache = &jwks
	jwksCacheUntil = time.Now().Add(10 * time.Minute)

	return &jwks, nil
}

func jwkToRSAPublicKey(jwk JWK) (any, error) {
	if jwk.Kty != "RSA" {
		return nil, fmt.Errorf("unsupported key type: %s", jwk.Kty)
	}

	nBytes, err := base64.RawURLEncoding.DecodeString(jwk.N)
	if err != nil {
		return nil, fmt.Errorf("failed to decode modulus n: %w", err)
	}

	eBytes, err := base64.RawURLEncoding.DecodeString(jwk.E)
	if err != nil {
		return nil, fmt.Errorf("failed to decode exponent e: %w", err)
	}

	n := new(big.Int).SetBytes(nBytes)
	e := new(big.Int).SetBytes(eBytes).Int64()

	return &rsa.PublicKey{
		N: n,
		E: int(e),
	}, nil
}
