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

// ── Which topic the home "Start / Continue studying" button opens ─────────────
/** A topic counts as done when nearly all its questions were answered, or when at
 *  least half were answered with 90%+ correct. */
export function topicDone(seen: number, count: number, accuracy: number | null): boolean {
  if (count <= 0) return true
  return seen >= count * 0.95 || (seen >= count * 0.5 && (accuracy ?? 0) >= 90)
}

/** First pass: topics in order (1 → 25), staying on the last opened one until it's
 *  done, then moving to the next unfinished one. Once every topic has been started:
 *  the topic that would raise readiness most (`bestGain`), else the last one. */
export function studyTarget(opts: {
  last: number | null
  seen: (t: number) => number
  count: (t: number) => number
  accuracy: (t: number) => number | null
  bestGain: number | null
}): number {
  const { last, seen, count, accuracy, bestGain } = opts
  const topics = Array.from({ length: 25 }, (_, i) => i + 1)
  const done = (t: number) => topicDone(seen(t), count(t), accuracy(t))
  if (topics.every(t => seen(t) > 0)) return bestGain ?? last ?? 1
  if (last && !done(last)) return last
  // Next unfinished topic after the last one, wrapping round to the start.
  const from = last ?? 0
  const order = [...topics.filter(t => t > from), ...topics.filter(t => t <= from)]
  return order.find(t => !done(t)) ?? bestGain ?? 1
}
