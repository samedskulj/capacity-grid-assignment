import type { Capacity, Hours } from '../../api/types'
import { isOverAllocated } from '../../helpers/capacity'
import { formatNumber } from '../../helpers/format'

type Props = { data: Capacity }

export function CapacitySummary({ data }: Props) {
  const overloaded = data.people.filter(isOverAllocated).length
  const total = (pick: (hours: Hours) => number) =>
    data.people.reduce((sum, person) => sum + person.weeks.reduce((weekSum, week) => weekSum + pick(week), 0), 0)
  const allocated = total(week => week.allocated_hours)
  const capacity = total(week => week.capacity_hours)

  return (
    <section className="summary" aria-label="Whole team summary for selected range">
      <div className="stat">
        <span>People in team</span>
        <strong>{formatNumber(data.people.length)}</strong>
        <small>Across {data.weeks.length} weeks</small>
      </div>
      <div className="stat stat--warning">
        <span>Over-allocated people</span>
        <strong>
          {formatNumber(overloaded)}
          <span className="stat__dot" aria-hidden="true" />
        </strong>
        <small>Over capacity in at least one week</small>
      </div>
      <div className="stat">
        <span>Allocated hours</span>
        <strong>
          {formatNumber(allocated)}
          <em>h</em>
        </strong>
        <small>Whole team · selected range</small>
      </div>
      <div className="stat">
        <span>Total capacity</span>
        <strong>
          {formatNumber(capacity)}
          <em>h</em>
        </strong>
        <small>Whole team · before allocation</small>
      </div>
    </section>
  )
}
