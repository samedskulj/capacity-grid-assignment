package capacity

import (
	"fmt"
	"time"
)

type Week struct {
	Start       string `json:"start"`
	From        string `json:"from"`
	To          string `json:"to"`
	WorkingDays int    `json:"working_days"`
}

type Hours struct {
	Allocated float64 `json:"allocated_hours"`
	Capacity  float64 `json:"capacity_hours"`
}

type Person struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	WeeklyHours float64 `json:"weekly_hours"`
	Weeks       []Hours `json:"weeks"`
}

type Response struct {
	Weeks  []Week   `json:"weeks"`
	People []Person `json:"people"`
}

func ParseRange(fromText, toText string) (time.Time, time.Time, []Week, error) {
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

	var weeks []Week
	for day := from; !day.After(to); day = day.AddDate(0, 0, 1) {
		monday := day.AddDate(0, 0, -(int(day.Weekday())+6)%7).Format(time.DateOnly)
		if len(weeks) == 0 || weeks[len(weeks)-1].Start != monday {
			weeks = append(weeks, Week{Start: monday, From: day.Format(time.DateOnly)})
		}
		week := &weeks[len(weeks)-1]
		week.To = day.Format(time.DateOnly)
		if day.Weekday() != time.Saturday && day.Weekday() != time.Sunday {
			week.WorkingDays++
		}
	}
	return from, to, weeks, nil
}

func capacityHours(weeklyHours float64, workingDays int) float64 {
	return weeklyHours * float64(workingDays) / 5
}
