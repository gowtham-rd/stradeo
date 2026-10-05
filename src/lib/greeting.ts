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

export type Line = { key: UIKey; n?: number; m?: number }

/** The everyday line under the name, built from real numbers: today's goal, what's
 *  left of it, days to the exam, readiness. Situations first (new, long break, late
 *  night, goal done, goal under way, ready), otherwise one of a few lines chosen by
 *  day and hour, so it varies but doesn't change between renders. */
export function greetingLine(o: {
  lastStudy: string | null; readiness: number; streak: number
  goal: number; doneToday: number; unseen: number; examDaysLeft: number | null; now?: Date
}): Line {
  const now = o.now ?? new Date()
  const days = daysSince(o.lastStudy, now)
  const h = now.getHours()
  if (days === null && o.doneToday === 0) return { key: 'gNew', n: o.goal, m: o.unseen }
  if (days !== null && days >= 7) return { key: 'gBack' }
  if (h < 5) return { key: 'gLateNight' }
  if (o.doneToday >= o.goal) return { key: 'gGoalDone', n: o.goal }
  if (o.doneToday > 0) return { key: 'gToGo', n: o.goal - o.doneToday }
  if (o.readiness >= 90) return { key: 'gReady', n: o.readiness }
  const pool: Line[] = [{ key: timeOfDay(h), n: o.goal }]
  if (o.streak >= 3) pool.push({ key: 'gStreak', n: o.streak })
  if (o.examDaysLeft !== null && o.examDaysLeft > 1 && o.unseen > 0) pool.push({ key: 'gCountdown', n: o.examDaysLeft, m: o.unseen })
  if (o.readiness >= 75) pool.push({ key: 'gClose', n: o.readiness })
  return pool[(now.getDate() + h) % pool.length]
}

// ── Home greeting v2: "Good evening, Marco" + the one line that matters today ──
export function salutation(h: number): UIKey {
  if (h >= 5 && h < 12) return 'helloMorning'
  if (h >= 12 && h < 18) return 'helloAfternoon'
  if (h >= 18 && h < 22) return 'helloEvening'
  return 'helloNight'
}

export type Milestone = { id: string; key: UIKey; n?: number }

/** Milestones the user has reached (each is shown once, on the day it is first seen). */
export function reachedMilestones(o: { totalDone: number; readiness: number; examPassed: boolean }): Milestone[] {
  const out: Milestone[] = []
  for (const n of [100, 500, 1000, 2500, 5000]) if (o.totalDone >= n) out.push({ id: `q${n}`, key: 'gMilestoneQ', n })
  if (o.examPassed) out.push({ id: 'exam1', key: 'gMilestoneExam' })
  if (o.readiness >= 90) out.push({ id: 'ready90', key: 'gMilestoneReady' })
  return out
}

/** Line under the greeting, most relevant first: exam day / eve / past, a fresh
 *  milestone, a return after a break, then the everyday lines. */
export function homeLine(o: {
  lastStudy: string | null; readiness: number; streak: number; dueCount: number
  examDaysLeft: number | null; milestone: Milestone | null
  goal: number; doneToday: number; unseen: number; now?: Date
}): Line {
  const now = o.now ?? new Date()
  const days = daysSince(o.lastStudy, now)
  if (o.examDaysLeft === 0) return { key: 'gExamDay' }
  if (o.examDaysLeft === 1) return { key: 'gExamTomorrow' }
  if (o.examDaysLeft !== null && o.examDaysLeft < 0) return { key: 'gExamOver' }
  if (o.milestone) return { key: o.milestone.key, n: o.milestone.n }
  if (days !== null && days >= 2 && o.dueCount > 0) return { key: 'gBackReviews', n: o.dueCount }
  return greetingLine({ ...o, now })
}
