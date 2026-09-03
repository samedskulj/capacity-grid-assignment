package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Run against the seeded Compose database with DATABASE_URL set.
// Temporary records are removed; the seeded people are never changed.
func TestSeededCapacityAndEditing(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL is required for the seeded integration test")
	}
	ctx := context.Background()
	db, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := &server{db: db}
	load := func(from, to string) capacityResponse {
		t.Helper()
		w := httptest.NewRecorder()
		s.handleCapacity(w, httptest.NewRequest("GET", "/api/capacity?from="+from+"&to="+to, nil))
		if w.Code != 200 {
			t.Fatalf("capacity: %d %s", w.Code, w.Body.String())
		}
		var result capacityResponse
		if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
			t.Fatal(err)
		}
		return result
	}
	result := load("2025-12-29", "2026-01-16")
	var count int
	if err := db.QueryRow(ctx, `SELECT count(*) FROM people`).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if len(result.People) != count || len(result.Weeks) != 3 {
		t.Fatalf("expected all %d people and 3 weeks", count)
	}
	expected := [][]float64{{40, 0, 30}, {0, 32, 8}, {0, 4, 12}, {0, 45, 40}, {0, 20, 0}}
	for i, hours := range expected {
		person := result.People[i]
		if person.ID != i+1 {
			t.Fatalf("unexpected seed person %d", person.ID)
		}
		for j, allocated := range hours {
			if person.Weeks[j].Allocated != allocated || person.Weeks[j].Capacity != person.WeeklyHours {
				t.Errorf("%s week %d: %+v, expected allocated=%v capacity=%v", person.Name, j, person.Weeks[j], allocated, person.WeeklyHours)
			}
		}
	}
	partial := load("2026-01-07", "2026-01-08")
	if got := partial.People[3].Weeks[0]; got.Allocated != 22 || got.Capacity != 16 {
		t.Errorf("Dee partial week: %+v, want allocated=22 capacity=16", got)
	}
	weekend := load("2026-01-10", "2026-01-11")
	for _, person := range weekend.People {
		if person.Weeks[0].Allocated != 0 || person.Weeks[0].Capacity != 0 {
			t.Errorf("weekend must be zero: %+v", person)
		}
	}
	var id int
	if err := db.QueryRow(ctx, `INSERT INTO people (name, weekly_hours) VALUES ('Capacity integration test', 20) RETURNING id`).Scan(&id); err != nil {
		t.Fatal(err)
	}
	defer func() {
		if _, err := db.Exec(ctx, `DELETE FROM people WHERE id = $1`, id); err != nil {
			t.Errorf("cleanup: %v", err)
		}
	}()
	for _, hours := range []float64{0, 7.5, 168} {
		r := httptest.NewRequest("PATCH", fmt.Sprintf("/api/people/%d", id), strings.NewReader(fmt.Sprintf(`{"weekly_hours":%v}`, hours)))
		r.SetPathValue("id", fmt.Sprint(id))
		r.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.handleUpdatePerson(w, r)
		if w.Code != 200 {
			t.Fatalf("update: %d %s", w.Code, w.Body.String())
		}
		updated := load("2026-01-07", "2026-01-08")
		person := updated.People[len(updated.People)-1]
		if person.ID != id || person.WeeklyHours != hours || person.Weeks[0].Capacity != hours*2/5 || person.Weeks[0].Allocated != 0 {
			t.Errorf("update not reflected in capacity: %+v", person)
		}
	}
	r := httptest.NewRequest("PATCH", "/api/people/2147483647", strings.NewReader(`{"weekly_hours":40}`))
	r.SetPathValue("id", "2147483647")
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	s.handleUpdatePerson(w, r)
	if w.Code != 404 {
		t.Errorf("unknown person: got %d", w.Code)
	}
}
