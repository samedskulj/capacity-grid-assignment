import { useState } from 'react'
import type { DateRange } from './api/types'
import { CapacityGrid } from './components/capacity/CapacityGrid'
import { RangeForm } from './components/form/RangeForm'

// The seed's hand-authored assignments live in these three weeks.
const DEFAULT_RANGE: DateRange = { from: '2025-12-29', to: '2026-01-16' }

export function App() {
  const [range, setRange] = useState(DEFAULT_RANGE)

  return (
    <>
      <header className="app-header">
        <a className="brand" href="/" aria-label="Capacity home">
          <span className="brand__mark" aria-hidden="true">
            ▦
          </span>
          capacity
        </a>
        <span className="app-header__label">TEAM PLANNING</span>
      </header>

      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">A clearer view of the week ahead</p>
            <h1>Team capacity</h1>
            <p className="intro">See who has room, and who needs a little more.</p>
          </div>
          <RangeForm range={range} onApply={setRange} />
        </div>

        {/* Keyed so a new range remounts the grid with fresh filters and paging. */}
        <CapacityGrid key={`${range.from}:${range.to}`} range={range} />
      </main>
    </>
  )
}
