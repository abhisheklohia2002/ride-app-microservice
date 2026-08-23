package httpx

import (
	"encoding/json"
	"net/http"
)

type ErrorPayload struct {
	Code    string `json:"code`
	Message string `json:"message"`
}

type errorEnvelope struct {
	Error ErrorPayload `json:"error"`
}

func Error(w http.ResponseWriter, status int, message string, code string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(&errorEnvelope{
		Error: ErrorPayload{
			Code:    code,
			Message: message,
		},
	})
}
