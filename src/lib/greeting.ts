import type { UIKey } from './i18n'

/** Calendar days between the last study day (YYYY-MM-DD, local) and `now`. */
export function daysSince(lastStudy: string | null, now = new Date()): number | null {
  if (!lastStudy) return null
  const [y, m, d] = lastStudy.split('-').map(Number)
  const then = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((today.getTime() - then.getTime()) / 86_400_000))
}

function timeOfDay(h: number): UIKey {
  if (h < 5) return 'gLateNight'
  if (h < 9) return 'gEarly'
  if (h < 12) return 'gMorning'
  if (h < 14) return 'gLunch'
  if (h < 18) return 'gAfternoon'
  if (h < 22) return 'gEvening'
  return 'gNight'
}

/** The line under the name: situation first (new, long break, late night, ready),
 *  otherwise a line for the time of day, mixed with streak / almost-there nudges.
 *  Stable for a given day and hour, so it doesn't change between renders. */
export function greetingLine(o: { lastStudy: string | null; readiness: number; streak: number; now?: Date }): { key: UIKey; n?: number } {
  const now = o.now ?? new Date()
  const days = daysSince(o.lastStudy, now)
  const h = now.getHours()
  if (days === null) return { key: 'gNew' }
  if (days >= 7) return { key: 'gBack' }
  if (h < 5) return { key: 'gLateNight' }
  if (o.readiness >= 90) return { key: 'gReady' }
  const seed = now.getDate() + h
  if (o.streak >= 3 && seed % 3 === 0) return { key: 'gStreak', n: o.streak }
  if (o.readiness >= 75 && seed % 3 === 1) return { key: 'gClose' }
  return { key: timeOfDay(h) }
}
