package people

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"mime"
	"net/http"
	"strconv"

	"capacity/api/internal/httpx"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	DB *pgxpool.Pool
}

type UpdateRequest struct {
	WeeklyHours *float64 `json:"weekly_hours"`
}

type UpdateResponse struct {
	ID          int     `json:"id"`
	WeeklyHours float64 `json:"weekly_hours"`
}

func (h *Handler) UpdateWeeklyHours(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 32)
	if err != nil || id <= 0 {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "Person ID must be a positive integer"})
		return
	}
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || mediaType != "application/json" {
		httpx.WriteJSON(w, http.StatusUnsupportedMediaType, map[string]string{"error": "Content-Type must be application/json"})
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 1024)
	var input UpdateRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "Provide a JSON object with weekly_hours"})
		return
	}
	if err := decoder.Decode(new(any)); err != io.EOF {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "Provide exactly one JSON object"})
		return
	}
	if input.WeeklyHours == nil || *input.WeeklyHours < 0 || *input.WeeklyHours > 168 {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "weekly_hours must be a number between 0 and 168"})
		return
	}

	var updated UpdateResponse
	err = h.DB.QueryRow(r.Context(), `
		UPDATE people SET weekly_hours = $1 WHERE id = $2
		RETURNING id, weekly_hours::float8`, *input.WeeklyHours, id).Scan(&updated.ID, &updated.WeeklyHours)
	if errors.Is(err, pgx.ErrNoRows) {
		httpx.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "Person not found"})
		return
	}
	if err != nil {
		log.Printf("update person: %v", err)
		httpx.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Could not save weekly hours"})
		return
	}
	httpx.WriteJSON(w, http.StatusOK, updated)
}
