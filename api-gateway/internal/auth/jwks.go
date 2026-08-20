package auth

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"math/big"
	"net/http"
	"sync"
)

type jwks struct {
	Keys []jwk `json:"keys"`
}

type jwk struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
}

var (
	publicKeys = make(map[string]*rsa.PublicKey)
	mutex      sync.RWMutex
)

func LoadJWKS(url string) error {

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var data jwks

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return err
	}

	keys := make(map[string]*rsa.PublicKey)

	for _, k := range data.Keys {

		pub, err := buildPublicKey(k)
		if err != nil {
			return err
		}

		keys[k.Kid] = pub
	}

	mutex.Lock()
	publicKeys = keys
	mutex.Unlock()

	return nil
}

func buildPublicKey(key jwk) (*rsa.PublicKey, error) {

	nb, err := base64.RawURLEncoding.DecodeString(key.N)
	if err != nil {
		return nil, err
	}

	eb, err := base64.RawURLEncoding.DecodeString(key.E)
	if err != nil {
		return nil, err
	}

	n := new(big.Int).SetBytes(nb)

	e := 0

	for _, b := range eb {
		e = e<<8 + int(b)
	}

	return &rsa.PublicKey{
		N: n,
		E: e,
	}, nil
}

func GetPublicKey(kid string) (*rsa.PublicKey, error) {

	mutex.RLock()
	defer mutex.RUnlock()

	key, ok := publicKeys[kid]

	if !ok {
		return nil, errors.New("public key not found")
	}

	return key, nil
}
