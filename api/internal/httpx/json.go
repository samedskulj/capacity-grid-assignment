package httpx

import (
	"encoding/json"
	"net/http"
)

// WriteJSON sets the JSON content type and encodes v with the given status.
func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
