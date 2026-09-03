# Decisions

Yours to write, not your AI's. Short is good — bullets are fine, and half a page is
plenty. We read this first.

## What did the spec not tell you?

There are things this brief doesn't specify. Which ones did you hit, what did you decide,
and why?

- Whether pagination, filtering and search should live on the client or the server. I went
  client-side: the whole range is a few KB, the summary row needs every person anyway, and
  the run environment is fixed. In hindsight the brief probably expected me to reach that
  conclusion on my own.
- Whether there were any design requirements — responsive layout, a particular look, etc.
  Nothing was specified, so I kept it plain and readable and focused on making
  over-allocation obvious.

## What did you notice that looked wrong?

Anything in the output that didn't match what you expected. Whether you fixed it or left
it, we want to know you saw it.

- Selecting certain ranges (e.g. 2026-07-01 to 2026-08-01) showed totals with floating-point
  noise, like `79,892.7999999999 h`. The API values were exact; the frontend was summing
  floats. Fixed by rounding the displayed value to two decimals. Also noted in
  `.notes/worklog.md`.

## What did the AI get wrong that you caught?

One concrete example. Every real session has one.

- On the Go side, almost everything at first. I don't have much Go experience, so I leaned
  on a crash course, a production-style API I found
  (https://www.youtube.com/watch?v=s3XItrqfccw&t=4658s) and a few Go skills, and above all
  on the "eye test": the AI kept producing Go that I found confusing, and my rule was that
  if it didn't make sense to me as a less experienced Go developer, it wouldn't make sense
  to anyone. That's what pushed the code from a flat layout into `api/internal/...`.
- On the frontend it initially put everything into one component. I have a lot more
  experience there, so it was easy to steer it towards a proper component/hook/api split.

## What would you do differently with a week?

- Move pagination, filtering, search and sorting to the server.
- Work in several feature branches instead of one.
- Track the work in a ticketing system like Jira.
- Spend real time on the frontend design so it actually makes managers' lives easier —
  something that could sit inside a product like Toggl.
- Focus more on implementing Tanstack Query with proper config as I add that later on in the project