import type { ReactNode } from 'react'

type Props = {
  selected: boolean
  count?: number
  disabled?: boolean
  onToggle: () => void
  children: ReactNode
}

export function FilterButton({ selected, count, disabled, onToggle, children }: Props) {
  return (
    <button
      type="button"
      className={`filter-button${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
    >
      {children}
      {count !== undefined && <span>{count}</span>}
    </button>
  )
}
