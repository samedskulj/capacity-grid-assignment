import type { Hours, Person } from '../api/types'

export const PAGE_SIZE = 50
export const MAX_WEEKLY_HOURS = 168

export type CellStatus = 'over' | 'within' | 'idle'

export const isOver = (hours: Hours) => hours.allocated_hours > hours.capacity_hours

export const overHours = (hours: Hours) => (isOver(hours) ? hours.allocated_hours - hours.capacity_hours : 0)

export const freeHours = (hours: Hours) => (isOver(hours) ? 0 : hours.capacity_hours - hours.allocated_hours)

export const isOverAllocated = (person: Person) => person.weeks.some(isOver)

export function cellStatus(hours: Hours): CellStatus {
  if (isOver(hours)) return 'over'
  return hours.allocated_hours > 0 ? 'within' : 'idle'
}

export function utilizationPercent(hours: Hours): number {
  if (hours.capacity_hours > 0) return Math.min(100, (hours.allocated_hours / hours.capacity_hours) * 100)
  return hours.allocated_hours > 0 ? 100 : 0
}

export function isValidWeeklyHours(raw: string): boolean {
  const value = Number(raw)
  return raw.trim() !== '' && Number.isFinite(value) && value >= 0 && value <= MAX_WEEKLY_HOURS
}
