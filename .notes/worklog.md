# Worklog

Running notes on how this got built — decisions, assumptions, dead ends, and anything
left unfinished. Append as you go; a line or two per entry is right.

---

- 2026-09-03: Count Monday–Friday only, with inclusive assignment and requested dates. Weeks start Monday; boundary-week capacity is weekly hours × selected weekdays / 5 so allocation and capacity cover the same period. No holiday calendar exists in the input.
- 2026-09-03: Add overlapping assignments, include people with no assignments, and compare hours directly for zero-capacity people (no division by zero). Limit requests to 366 inclusive days and weekly capacity to 0–168 hours, accepting fractions.
- 2026-09-03: After capacity edits, refetch the active range from the API and keep the editor pending until that succeeds. A failed refresh must not leave old totals looking current. Keep the existing schema, seed, and run environment unchanged.
- 2026-09-03: API tests pass in Compose against Postgres. Verified the five hand-authored seed cases, partial and weekend ranges, overlapping work, zero/fractional capacity edits, malformed requests, and unknown people. Tests create and remove a temporary person instead of changing seeded people.
- 2026-09-03: Split the API into `api/internal/{capacity,people,httpx}` with `main.go` left at the root as wiring only. A `cmd/` layout was ruled out because the fixed Dockerfile runs `go build .` from `api/`. Tests moved next to the code they cover; nothing at the root.
- 2026-09-03: Pass range bounds to Postgres as `date` strings, not `time.Time`. The old `timestamptz -> date` cast shifted week boundaries by a day under a non-UTC session timezone (confirmed with `SET TimeZone='America/New_York'`). Week-index lookups now fail loudly instead of silently writing into week 0.
- 2026-09-03: Broke the single 195-line `CapacityGrid.tsx` into `components/capacity/*` (domain, prefixed), `components/ui/*` (generic toolbar, search, filter, pagination, legend), `components/form/RangeForm`, `helpers/`, and a `useCapacity` hook that owns fetch/save/refetch. `App.tsx` only renders. Dropped the float tolerance in the over-allocation check; hours come from Postgres `numeric` sums and compare exactly.
- 2026-09-03: Replaced the one-line-per-rule `styles.css` with `styles/{tokens,base,layout,grid}.css`. Colours, radii and type sizes live in `tokens.css` as custom properties; the visual language is unchanged.
- 2026-09-03: Seen in the running grid: team total capacity rendered as `79,892.7999999999 h` for a 5-week range. Per-cell values are exact tenths from the API; the noise comes from summing ~2,500 floats in the browser. Display now formats to two decimals rather than rounding the data.
- 2026-09-03: No server-side pagination, search, or filtering on purpose. The summary stats need the whole team; the full payload is ~95 kB for 3 weeks (≈1.3 MB worst case at 53 weeks, highly compressible); "over-allocated" is derived from the same query; accent-insensitive search would need the `unaccent` extension. Client-side paging keeps the DOM small. If the team or ranges grow much, add `q`/`over_only`/`page` params and a separate summary endpoint — the `people CROSS JOIN weeks` query paginates cleanly on the people side.
