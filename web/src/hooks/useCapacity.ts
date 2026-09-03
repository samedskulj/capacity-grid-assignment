import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCapacity, updateWeeklyHours } from '../api/capacity'
import type { Capacity, DateRange, Person } from '../api/types'


export function useCapacity(range: DateRange) {
  const [data, setData] = useState<Capacity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  // One controller per mounted range; aborted on unmount so late responses are ignored.
  const lifetime = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    const signal = lifetime.current?.signal
    if (!signal) return
    setLoading(true)
    setError('')
    try {
      const result = await fetchCapacity(range, signal)
      if (!signal.aborted) setData(result)
    } catch (cause) {
      if (!signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load capacity.')
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [range.from, range.to])

  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    void load()
    return () => controller.abort()
  }, [load])

  async function saveWeeklyHours(person: Person, weeklyHours: number): Promise<string | null> {
    const signal = lifetime.current?.signal
    if (!signal || saving) return null
    setSaving(true)
    setNotice('')

    let saved = false
    try {
      await updateWeeklyHours(person.id, weeklyHours, signal)
      saved = true
      const updated = await fetchCapacity(range, signal)
      if (signal.aborted) return null
      setData(updated)
      setNotice(`Saved ${person.name}’s weekly capacity. All weeks are up to date.`)
      return null
    } catch (cause) {
      if (signal.aborted) return null
      if (saved) {
        setData(null)
        setError('Weekly hours were saved, but the grid could not refresh. Retry to load the updated numbers.')
        return null
      }
      return cause instanceof Error ? cause.message : 'Could not confirm the save. Please retry.'
    } finally {
      if (!signal.aborted) setSaving(false)
    }
  }

  return { data, loading, error, saving, notice, reload: load, saveWeeklyHours, clearNotice: () => setNotice('') }
}
