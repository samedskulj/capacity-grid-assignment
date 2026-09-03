import type { FormEvent } from 'react'
import type { Person } from '../../api/types'
import { MAX_WEEKLY_HOURS } from '../../helpers/capacity'

type Props = {
  person: Person
  value: string
  error: string
  saving: boolean
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function CapacityHoursEditor({ person, value, error, saving, onChange, onSubmit, onCancel }: Props) {
  const inputId = `hours-${person.id}`
  const errorId = `error-${person.id}`

  return (
    <form
      className="hours-editor"
      onSubmit={onSubmit}
      onKeyDown={event => {
        if (event.key === 'Escape' && !saving) onCancel()
      }}
    >
      <label className="sr-only" htmlFor={inputId}>
        Weekly hours for {person.name}
      </label>
      <input
        id={inputId}
        type="number"
        min="0"
        max={MAX_WEEKLY_HOURS}
        step="any"
        required
        autoFocus
        value={value}
        disabled={saving}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={event => onChange(event.target.value)}
      />
      <div className="hours-editor__actions">
        <button className="primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" disabled={saving} onClick={onCancel}>
          Cancel
        </button>
      </div>
      {error && (
        <p className="error" role="alert" id={errorId}>
          {error}
        </p>
      )}
    </form>
  )
}
