import { useRef, useState, type FormEvent } from 'react'
import type { DateRange, Person } from '../../api/types'
import { PAGE_SIZE, isOverAllocated, isValidWeeklyHours } from '../../helpers/capacity'
import { formatDate, searchKey } from '../../helpers/format'
import { useCapacity } from '../../hooks/useCapacity'
import { FilterButton } from '../ui/FilterButton'
import { Legend } from '../ui/Legend'
import { Pagination } from '../ui/Pagination'
import { SearchField } from '../ui/SearchField'
import { Toolbar } from '../ui/Toolbar'
import { CapacitySummary } from './CapacitySummary'
import { CapacityTable, type EditorState } from './CapacityTable'

type Props = { range: DateRange }

export function CapacityGrid({ range }: Props) {
  const { data, loading, error, saving, notice, reload, saveWeeklyHours, clearNotice } = useCapacity(range)

  const [search, setSearch] = useState('')
  const [onlyOver, setOnlyOver] = useState(false)
  const [page, setPage] = useState(0)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const editButtons = useRef(new Map<number, HTMLButtonElement>())

  function resetView() {
    setPage(0)
    setEditor(null)
  }

  function registerEditButton(personId: number, node: HTMLButtonElement | null) {
    if (node) editButtons.current.set(personId, node)
    else editButtons.current.delete(personId)
  }

  function startEdit(person: Person) {
    setEditor({ id: person.id, value: String(person.weekly_hours), error: '' })
    clearNotice()
  }

  function closeEditor(personId: number) {
    setEditor(null)
    requestAnimationFrame(() => editButtons.current.get(personId)?.focus())
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>, person: Person) {
    event.preventDefault()
    if (!editor || saving) return
    if (!isValidWeeklyHours(editor.value)) {
      setEditor({ ...editor, error: 'Enter hours between 0 and 168.' })
      return
    }
    setEditor({ ...editor, error: '' })
    const message = await saveWeeklyHours(person, Number(editor.value))
    if (message) setEditor(current => current && { ...current, error: message })
    else closeEditor(person.id)
  }

  if (!data) {
    return (
      <section className="state-card" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <p>Loading team capacity…</p>
        ) : (
          <>
            <p className="error" role="alert">
              {error}
            </p>
            <button type="button" onClick={reload}>
              Retry
            </button>
          </>
        )}
      </section>
    )
  }

  const overloadedCount = data.people.filter(isOverAllocated).length
  const needle = searchKey(search)
  const filtered = data.people.filter(
    person => searchKey(person.name).includes(needle) && (!onlyOver || isOverAllocated(person)),
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const rangeLabel = filtered.length
    ? `${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)}`
    : '0'

  return (
    <>
      <CapacitySummary data={data} />

      <section className="grid-card" aria-label="Weekly capacity">
        <Toolbar
          title="Weekly overview"
          subtitle={`${formatDate(range.from)} ${range.from.slice(0, 4)} — ${formatDate(range.to)} ${range.to.slice(0, 4)}`}
        >
          <SearchField
            label="Search people"
            placeholder="Search people…"
            value={search}
            disabled={saving}
            onChange={value => {
              setSearch(value)
              resetView()
            }}
          />
          <FilterButton
            selected={onlyOver}
            count={overloadedCount}
            disabled={saving}
            onToggle={() => {
              setOnlyOver(current => !current)
              resetView()
            }}
          >
            Over-allocated only
          </FilterButton>
        </Toolbar>

        <div className="grid-meta">
          <span>Hours allocated / capacity · Monday–Friday</span>
          <Legend
            items={[
              { tone: 'within', label: 'Within capacity' },
              { tone: 'over', label: 'Over capacity' },
            ]}
          />
        </div>

        <div className="notice" role="status">
          {saving ? 'Saving weekly capacity and refreshing all weeks…' : notice}
        </div>

        <CapacityTable
          weeks={data.weeks}
          people={visible}
          totalPeople={data.people.length}
          filteredCount={filtered.length}
          editor={editor}
          saving={saving}
          onStartEdit={startEdit}
          onEditChange={value => setEditor(current => current && { ...current, value, error: '' })}
          onEditSubmit={submitEdit}
          onEditCancel={closeEditor}
          registerEditButton={registerEditButton}
        />

        <footer className="grid-footer">
          <span>
            {rangeLabel} of {filtered.length} people
          </span>
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            disabled={saving}
            onChange={next => {
              setPage(next)
              setEditor(null)
            }}
          />
        </footer>
      </section>

      <p className="footnote">
        Capacity is spread evenly across five working days. Partial weeks count only the selected weekdays. Weekly
        capacity edits apply to all weeks.
      </p>
    </>
  )
}
