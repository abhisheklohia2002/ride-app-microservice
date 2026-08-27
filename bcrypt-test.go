package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "admin"

	hash := "$2a$10$aIFX5Z1aDXulwtg3k6/fweXQgVt7mOHh/tipYBpW1ssuDAYmpPa.W"

	err := bcrypt.CompareHashAndPassword(
		[]byte(hash),
		[]byte(password),
	)

	fmt.Println("Result:", err)
}
