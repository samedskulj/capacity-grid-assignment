package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

type capacityWeek struct {
	Start       string `json:"start"`
	From        string `json:"from"`
	To          string `json:"to"`
	WorkingDays int    `json:"working_days"`
}

type weekHours struct {
	Allocated float64 `json:"allocated_hours"`
	Capacity  float64 `json:"capacity_hours"`
}

type capacityPerson struct {
	ID          int         `json:"id"`
	Name        string      `json:"name"`
	WeeklyHours float64     `json:"weekly_hours"`
	Weeks       []weekHours `json:"weeks"`
}

type capacityResponse struct {
	Weeks  []capacityWeek   `json:"weeks"`
	People []capacityPerson `json:"people"`
}

// Requested dates are inclusive. Both measures count only the selected weekdays.
func capacityRange(fromText, toText string) (time.Time, time.Time, []capacityWeek, error) {
	from, err := time.Parse(time.DateOnly, fromText)
	if err != nil || from.Year() < 1 {
		return time.Time{}, time.Time{}, nil, fmt.Errorf("from must be a date in YYYY-MM-DD format")
	}
	to, err := time.Parse(time.DateOnly, toText)
	if err != nil || to.Year() < 1 {
		return time.Time{}, time.Time{}, nil, fmt.Errorf("to must be a date in YYYY-MM-DD format")
	}
	if to.Before(from) || to.After(from.AddDate(0, 0, 365)) {
		return time.Time{}, time.Time{}, nil, fmt.Errorf("range must be ordered and contain at most 366 days")
	}
	weeks := make([]capacityWeek, 0)
	for day := from; !day.After(to); day = day.AddDate(0, 0, 1) {
		monday := day.AddDate(0, 0, -(int(day.Weekday())+6)%7).Format(time.DateOnly)
		if len(weeks) == 0 || weeks[len(weeks)-1].Start != monday {
			weeks = append(weeks, capacityWeek{Start: monday, From: day.Format(time.DateOnly)})
		}
		week := &weeks[len(weeks)-1]
		week.To = day.Format(time.DateOnly)
		if day.Weekday() != time.Saturday && day.Weekday() != time.Sunday {
			week.WorkingDays++
		}
	}
	return from, to, weeks, nil
}

func (s *server) handleCapacity(w http.ResponseWriter, r *http.Request) {
	from, to, weeks, err := capacityRange(r.URL.Query().Get("from"), r.URL.Query().Get("to"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	// Aggregate assignments once, then include every person/week even with no work.
	rows, err := s.db.Query(r.Context(), `
		WITH days AS (
			SELECT day::date AS day, date_trunc('week', day)::date AS week
			FROM generate_series($1::date::timestamp, $2::date::timestamp, interval '1 day') AS day
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
		ORDER BY p.id, w.week`, from, to)
	if err != nil {
		log.Printf("capacity query: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Could not load capacity"})
		return
	}
	defer rows.Close()
	result := capacityResponse{Weeks: weeks, People: make([]capacityPerson, 0)}
	weekIndex := make(map[string]int, len(weeks))
	for i, week := range weeks {
		weekIndex[week.Start] = i
	}
	for rows.Next() {
		var person capacityPerson
		var week time.Time
		var allocated float64
		if err := rows.Scan(&person.ID, &person.Name, &person.WeeklyHours, &week, &allocated); err != nil {
			log.Printf("capacity scan: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Could not load capacity"})
			return
		}
		if len(result.People) == 0 || result.People[len(result.People)-1].ID != person.ID {
			person.Weeks = make([]weekHours, len(weeks))
			result.People = append(result.People, person)
		}
		i := weekIndex[week.Format(time.DateOnly)]
		result.People[len(result.People)-1].Weeks[i] = weekHours{
			Allocated: allocated,
			Capacity:  person.WeeklyHours * float64(weeks[i].WorkingDays) / 5,
		}
	}
	if err := rows.Err(); err != nil {
		log.Printf("capacity rows: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Could not load capacity"})
		return
	}
	writeJSON(w, http.StatusOK, result)
}
