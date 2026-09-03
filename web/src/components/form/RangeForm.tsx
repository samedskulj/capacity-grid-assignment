import { useState, type FormEvent } from 'react'
import type { DateRange } from '../../api/types'

const MAX_RANGE_DAYS = 366
const MS_PER_DAY = 86_400_000

type Props = {
  range: DateRange
  onApply: (range: DateRange) => void
}

export function RangeForm({ range, onApply }: Props) {
  const [draft, setDraft] = useState(range)
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const days = (Date.parse(draft.to) - Date.parse(draft.from)) / MS_PER_DAY + 1
    if (!Number.isFinite(days) || days < 1 || days > MAX_RANGE_DAYS) {
      setError(`Choose an ordered date range of up to ${MAX_RANGE_DAYS} days.`)
      return
    }
    setError('')
    onApply(draft)
  }

  return (
    <div className="range-form-wrap">
      <form className="range-form" onSubmit={submit} aria-label="Date range">
        <label>
          From
          <input
            type="date"
            required
            value={draft.from}
            onChange={event => setDraft({ ...draft, from: event.target.value })}
          />
        </label>
        <label>
          To
          <input
            type="date"
            required
            value={draft.to}
            onChange={event => setDraft({ ...draft, to: event.target.value })}
          />
        </label>
        <button className="primary" type="submit">
          Apply range
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
