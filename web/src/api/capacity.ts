import type { Capacity, DateRange } from './types'

async function readJSON<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${response.status}). Please try again.`)
  }
  return response.json() as Promise<T>
}

export async function fetchCapacity({ from, to }: DateRange, signal?: AbortSignal): Promise<Capacity> {
  const query = new URLSearchParams({ from, to })
  return readJSON<Capacity>(await fetch(`/api/capacity?${query}`, { signal }))
}

export async function updateWeeklyHours(personId: number, weeklyHours: number): Promise<void> {
  await readJSON(
    await fetch(`/api/people/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekly_hours: weeklyHours }),
    }),
  )
}
