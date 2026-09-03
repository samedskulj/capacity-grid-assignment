package people

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestInvalidUpdates(t *testing.T) {
	h := &Handler{}
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
		h.UpdateWeeklyHours(w, r)
		if w.Code != test.status {
			t.Errorf("%+v: got status %d", test, w.Code)
		}
	}
}
