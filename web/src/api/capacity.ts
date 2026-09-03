import { queryOptions } from '@tanstack/react-query'
import { readJSON } from './client'
import type { Capacity, DateRange } from './types'

export async function fetchCapacity({ from, to }: DateRange, signal?: AbortSignal): Promise<Capacity> {
  const query = new URLSearchParams({ from, to })
  return readJSON<Capacity>(await fetch(`/api/capacity?${query}`, { signal }))
}

/** Query definition for GET /api/capacity; the key doubles as the invalidation target after edits. */
export const capacityQuery = (range: DateRange) =>
  queryOptions({
    queryKey: ['capacity', range.from, range.to] as const,
    queryFn: ({ signal }) => fetchCapacity(range, signal),
    retry: false,
  })
