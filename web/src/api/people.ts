import { readJSON } from './client'

export async function updateWeeklyHours(personId: number, weeklyHours: number): Promise<void> {
  await readJSON(
    await fetch(`/api/people/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekly_hours: weeklyHours }),
    }),
  )
}
