package capacity

import (
	"testing"
)

func TestParseRange(t *testing.T) {
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
			_, _, weeks, err := ParseRange(test.from, test.to)
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

func TestParseRangeLimits(t *testing.T) {
	if _, _, _, err := ParseRange("2026-01-01", "2027-01-01"); err != nil {
		t.Errorf("366 inclusive days should be accepted: %v", err)
	}
	if _, _, _, err := ParseRange("2026-01-05", "2026-01-04"); err == nil {
		t.Error("reversed range should be rejected")
	}
}
