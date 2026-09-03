import type { FormEvent } from 'react'
import type { Hours, Person, Week } from '../../api/types'
import { cellStatus, freeHours, overHours, utilizationPercent } from '../../helpers/capacity'
import { formatDate, formatNumber } from '../../helpers/format'
import { CapacityHoursEditor } from './CapacityHoursEditor'

export type EditorState = { id: number; value: string; error: string }

type Props = {
  weeks: Week[]
  people: Person[]
  totalPeople: number
  filteredCount: number
  editor: EditorState | null
  saving: boolean
  onStartEdit: (person: Person) => void
  onEditChange: (value: string) => void
  onEditSubmit: (event: FormEvent<HTMLFormElement>, person: Person) => void
  onEditCancel: (personId: number) => void
  registerEditButton: (personId: number, node: HTMLButtonElement | null) => void
}

export function CapacityTable({
  weeks,
  people,
  totalPeople,
  filteredCount,
  editor,
  saving,
  onStartEdit,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  registerEditButton,
}: Props) {
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label="Capacity table, scroll for more people and weeks"
      aria-busy={saving}
    >
      <table>
        <caption className="sr-only">
          Allocated hours against capacity for each person and week. Edit weekly capacity using the hours button beside
          a name.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="person-column">
              Team member <span>{filteredCount}</span>
            </th>
            <th scope="col" className="capacity-column">
              Weekly capacity
            </th>
            {weeks.map(week => (
              <WeekHeader key={week.start} week={week} />
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map(person => (
            <tr key={person.id}>
              <th scope="row" className="person-column">
                <div className="person-name">
                  <span className="avatar" aria-hidden="true">
                    {Array.from(person.name)[0]}
                  </span>
                  <bdi>{person.name}</bdi>
                </div>
              </th>
              <td className="capacity-column">
                {editor?.id === person.id ? (
                  <CapacityHoursEditor
                    person={person}
                    value={editor.value}
                    error={editor.error}
                    saving={saving}
                    onChange={onEditChange}
                    onSubmit={event => onEditSubmit(event, person)}
                    onCancel={() => onEditCancel(person.id)}
                  />
                ) : (
                  <button
                    type="button"
                    className="edit-hours"
                    ref={node => registerEditButton(person.id, node)}
                    disabled={saving}
                    aria-label={`Edit weekly hours for ${person.name}, currently ${person.weekly_hours}`}
                    onClick={() => onStartEdit(person)}
                  >
                    {formatNumber(person.weekly_hours)} <span>h / week</span>
                    <span className="edit-hours__label">Edit</span>
                  </button>
                )}
              </td>
              {person.weeks.map((hours, index) => (
                <HoursCell key={weeks[index].start} hours={hours} />
              ))}
            </tr>
          ))}
          {people.length === 0 && (
            <tr>
              <td className="empty" colSpan={weeks.length + 2}>
                {totalPeople === 0 ? 'No people in the team yet.' : 'No people match these filters.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function WeekHeader({ week }: { week: Week }) {
  const dayLabel = week.working_days === 1 ? 'day' : 'days'
  return (
    <th scope="col" className="week-column">
      <span className="week-column__label">WEEK OF {formatDate(week.start).toUpperCase()}</span>
      <span className="week-column__dates">
        {formatDate(week.from)} – {formatDate(week.to)}
      </span>
      <small>
        {week.working_days} working {dayLabel}
        {week.working_days < 5 ? ' · partial' : ''}
      </small>
    </th>
  )
}

function HoursCell({ hours }: { hours: Hours }) {
  const status = cellStatus(hours)

  let note: string
  if (status === 'over') note = `${formatNumber(overHours(hours))} h over`
  else if (hours.capacity_hours === 0) note = 'No capacity'
  else if (hours.allocated_hours === 0) note = 'Unallocated'
  else note = `${formatNumber(freeHours(hours))} h free`

  return (
    <td className={`hours-cell hours-cell--${status}`}>
      <div className="hours-cell__value">
        <strong>{formatNumber(hours.allocated_hours)}</strong>
        <span> / {formatNumber(hours.capacity_hours)} h</span>
      </div>
      <div className="utilization" aria-hidden="true">
        <span style={{ width: `${utilizationPercent(hours)}%` }} />
      </div>
      <small>{note}</small>
    </td>
  )
}
