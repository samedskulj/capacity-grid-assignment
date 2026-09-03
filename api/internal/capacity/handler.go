package capacity

import (
	"log"
	"net/http"
	"time"

	"capacity/api/internal/httpx"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	DB *pgxpool.Pool
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	from, to, weeks, err := ParseRange(r.URL.Query().Get("from"), r.URL.Query().Get("to"))
	if err != nil {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	rows, err := h.DB.Query(r.Context(), `
		WITH days AS (
			SELECT d::date AS day, date_trunc('week', d::timestamp)::date AS week
			FROM generate_series($1::date, $2::date, interval '1 day') AS d
		), weeks AS (
			SELECT DISTINCT week FROM days
		), allocated AS (
			SELECT a.person_id, d.week, sum(a.hours_per_day) AS hours
			FROM assignments a
			JOIN days d ON d.day BETWEEN a.start_date AND a.end_date
			WHERE extract(isodow FROM d.day) <= 5
			GROUP BY a.person_id, d.week
		)
		SELECT p.id, p.name, p.weekly_hours::float8, w.week,
		       coalesce(a.hours, 0)::float8
		FROM people p CROSS JOIN weeks w
		LEFT JOIN allocated a ON a.person_id = p.id AND a.week = w.week
		ORDER BY p.id, w.week`, from.Format(time.DateOnly), to.Format(time.DateOnly))
	if err != nil {
		log.Printf("capacity query: %v", err)
		httpx.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Could not load capacity"})
		return
	}
	defer rows.Close()

	result := Response{Weeks: weeks, People: make([]Person, 0)}
	weekIndex := make(map[string]int, len(weeks))
	for i, week := range weeks {
		weekIndex[week.Start] = i
	}

	for rows.Next() {
		var person Person
		var week time.Time
		var allocated float64
		if err := rows.Scan(&person.ID, &person.Name, &person.WeeklyHours, &week, &allocated); err != nil {
			log.Printf("capacity scan: %v", err)
			httpx.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Could not load capacity"})
			return
		}
		if len(result.People) == 0 || result.People[len(result.People)-1].ID != person.ID {
			person.Weeks = make([]Hours, len(weeks))
			result.People = append(result.People, person)
		}
		i, ok := weekIndex[week.Format(time.DateOnly)]
		if !ok {
			log.Printf("capacity week mismatch: %s", week.Format(time.DateOnly))
			httpx.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Could not load capacity"})
			return
		}
		result.People[len(result.People)-1].Weeks[i] = Hours{
			Allocated: allocated,
			Capacity:  capacityHours(person.WeeklyHours, weeks[i].WorkingDays),
		}
	}
	if err := rows.Err(); err != nil {
		log.Printf("capacity rows: %v", err)
		httpx.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Could not load capacity"})
		return
	}
	httpx.WriteJSON(w, http.StatusOK, result)
}
