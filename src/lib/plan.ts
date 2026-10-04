// Exam countdown and daily question goal (pure, unit-tested).

/** Local calendar date YYYY-MM-DD. */
export const localDay = (d = new Date()) => d.toLocaleDateString('sv')

/** Whole calendar days from `now` to the exam date (0 = today, negative = passed), or null. */
export function daysUntil(examDate: string | null | undefined, now = new Date()): number | null {
  if (!examDate || !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) return null
  const [y, m, d] = examDate.split('-').map(Number)
  const exam = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((exam.getTime() - today.getTime()) / 86_400_000)
}

export const GOAL_DEFAULT = 30
export const GOAL_MIN = 20
export const GOAL_MAX = 100

/** Questions to answer today: spread the questions not yet seen over the days left
 *  (rounded to 5, between GOAL_MIN and GOAL_MAX). No date, exam day or passed: GOAL_DEFAULT. */
export function dailyGoal(unseen: number, daysLeft: number | null): number {
  if (daysLeft === null || daysLeft <= 0) return GOAL_DEFAULT
  const raw = Math.ceil(Math.max(0, unseen) / daysLeft)
  return Math.min(GOAL_MAX, Math.max(GOAL_MIN, Math.ceil(raw / 5) * 5))
}
