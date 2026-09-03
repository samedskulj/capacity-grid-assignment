import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { capacityQuery } from '../api/capacity'
import { updateWeeklyHours } from '../api/people'
import type { DateRange, Person } from '../api/types'

/** Thrown when the PATCH succeeded but the follow-up refetch did not. */
class RefreshFailedError extends Error {}

/**
 * Loads capacity for a range and saves weekly-hours edits.
 *
 * After a save the whole range is refetched so every week reflects the new
 * capacity. The mutation stays pending until that refetch settles; if it
 * fails the grid shows an error instead of stale totals.
 */
export function useCapacity(range: DateRange) {
  const queryClient = useQueryClient()
  const { queryKey } = capacityQuery(range)
  const [notice, setNotice] = useState('')

  const query = useQuery(capacityQuery(range))

  const mutation = useMutation({
    mutationFn: async ({ person, weeklyHours }: { person: Person; weeklyHours: number }) => {
      await updateWeeklyHours(person.id, weeklyHours)
      try {
        await queryClient.invalidateQueries({ queryKey }, { throwOnError: true })
      } catch {
        throw new RefreshFailedError()
      }
      return person
    },
    onSuccess: person => setNotice(`Saved ${person.name}’s weekly capacity. All weeks are up to date.`),
  })

  /** Returns an error message when the save itself failed, otherwise null. */
  async function saveWeeklyHours(person: Person, weeklyHours: number): Promise<string | null> {
    setNotice('')
    try {
      await mutation.mutateAsync({ person, weeklyHours })
      return null
    } catch (cause) {
      if (cause instanceof RefreshFailedError) return null
      return cause instanceof Error ? cause.message : 'Could not confirm the save. Please retry.'
    }
  }

  const refreshFailed = query.isError && mutation.error instanceof RefreshFailedError
  const error = refreshFailed
    ? 'Weekly hours were saved, but the grid could not refresh. Retry to load the updated numbers.'
    : (query.error?.message ?? '')

  return {
    // Hide retained data when the last refetch failed; stale totals must not look current.
    data: query.isError ? null : (query.data ?? null),
    loading: query.isPending,
    error,
    saving: mutation.isPending,
    notice,
    reload: () => void query.refetch(),
    saveWeeklyHours,
    clearNotice: () => setNotice(''),
  }
}
