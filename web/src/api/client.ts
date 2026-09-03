/**
 * fetch() resolves on 4xx/5xx, but TanStack Query only enters its error state
 * when the query/mutation function throws. This is the one place that turns a
 * non-2xx response into an Error carrying the API's message.
 */
export async function readJSON<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${response.status}). Please try again.`)
  }
  return response.json() as Promise<T>
}
