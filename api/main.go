package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"capacity/api/internal/capacity"
	"capacity/api/internal/httpx"
	"capacity/api/internal/people"

	"github.com/jackc/pgx/v5/pgxpool"
)

type server struct {
	db       *pgxpool.Pool
	capacity *capacity.Handler
	people   *people.Handler
}

func main() {
	ctx := context.Background()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://capacity:capacity@localhost:5432/capacity?sslmode=disable"
	}

	db, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer db.Close()

	for i := 0; i < 30; i++ {
		if err = db.Ping(ctx); err == nil {
			break
		}
		time.Sleep(time.Second)
	}
	if err != nil {
		log.Fatalf("ping: %v", err)
	}

	s := &server{
		db:       db,
		capacity: &capacity.Handler{DB: db},
		people:   &people.Handler{DB: db},
	}

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", s.routes()))
}

func (s *server) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", s.handleHealth)
	mux.HandleFunc("GET /api/capacity", s.capacity.Get)
	mux.HandleFunc("PATCH /api/people/{id}", s.people.UpdateWeeklyHours)
	return mux
}

func (s *server) handleHealth(w http.ResponseWriter, r *http.Request) {
	var peopleCount int
	if err := s.db.QueryRow(r.Context(), `SELECT count(*) FROM people`).Scan(&peopleCount); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"ok": true, "people": peopleCount})
}
