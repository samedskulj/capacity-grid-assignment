package main

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCapacityRange(t *testing.T) {
	for _, test := range []struct {
		name, from, to string
		starts         []string
		days           []int
	}{
		{"year boundary", "2025-12-29", "2026-01-16", []string{"2025-12-29", "2026-01-05", "2026-01-12"}, []int{5, 5, 5}},
		{"partial weeks", "2026-01-07", "2026-01-13", []string{"2026-01-05", "2026-01-12"}, []int{3, 2}},
		{"weekend only", "2026-01-10", "2026-01-11", []string{"2026-01-05"}, []int{0}},
		{"single day", "2026-01-05", "2026-01-05", []string{"2026-01-05"}, []int{1}},
		{"leap day", "2024-02-29", "2024-02-29", []string{"2024-02-26"}, []int{1}},
	} {
		t.Run(test.name, func(t *testing.T) {
			_, _, weeks, err := capacityRange(test.from, test.to)
			if err != nil || len(weeks) != len(test.starts) {
				t.Fatalf("weeks=%v, error=%v", weeks, err)
			}
			for i, week := range weeks {
				if week.Start != test.starts[i] || week.WorkingDays != test.days[i] {
					t.Errorf("week %d: got %+v", i, week)
				}
			}
			if weeks[0].From != test.from || weeks[len(weeks)-1].To != test.to {
				t.Error("boundary weeks must retain the requested dates")
			}
		})
	}
}

func TestInvalidCapacityRanges(t *testing.T) {
	for _, query := range []string{
		"", "from=2026-01-01", "from=2026-02-30&to=2026-03-01",
		"from=2026-01-05&to=2026-01-04", "from=2026-01-01&to=2027-01-02",
		"from=0000-01-01&to=0000-01-02",
	} {
		recorder := httptest.NewRecorder()
		(&server{}).handleCapacity(recorder, httptest.NewRequest("GET", "/api/capacity?"+query, nil))
		if recorder.Code != 400 {
			t.Errorf("%q: got %d", query, recorder.Code)
		}
	}
	if _, _, _, err := capacityRange("2026-01-01", "2027-01-01"); err != nil {
		t.Errorf("366 inclusive days should be accepted: %v", err)
	}
}

func TestInvalidPersonUpdates(t *testing.T) {
	for _, test := range []struct {
		id, contentType, body string
		status                int
	}{
		{"0", "application/json", `{"weekly_hours":40}`, 400},
		{"abc", "application/json", `{"weekly_hours":40}`, 400},
		{"1", "text/plain", `{"weekly_hours":40}`, 415},
		{"1", "application/json", `{}`, 400},
		{"1", "application/json", `null`, 400},
		{"1", "application/json", `{"weekly_hours":null}`, 400},
		{"1", "application/json", `{"weekly_hours":-1}`, 400},
		{"1", "application/json", `{"weekly_hours":169}`, 400},
		{"1", "application/json", `{"weekly_hours":"40"}`, 400},
		{"1", "application/json", `{"weekly_hours":40,"name":"changed"}`, 400},
		{"1", "application/json", `{"weekly_hours":40} {}`, 400},
		{"1", "application/json", `{"weekly_hours":1e999}`, 400},
		{"1", "application/json", strings.Repeat(" ", 1025) + `{}`, 400},
	} {
		r := httptest.NewRequest("PATCH", "/api/people/"+test.id, strings.NewReader(test.body))
		r.SetPathValue("id", test.id)
		r.Header.Set("Content-Type", test.contentType)
		w := httptest.NewRecorder()
		(&server{}).handleUpdatePerson(w, r)
		if w.Code != test.status {
			t.Errorf("%+v: got status %d", test, w.Code)
		}
	}
}
