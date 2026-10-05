export const EXAM_DURATION = 20 * 60 // 20 minutes in seconds
export const EXAM_QUESTIONS = 30
export const MAX_ERRORS = 3
// Smart Review schedule, in calendar days. A missed question is due again from the
// start of the day REVIEW_STEP_DAYS[0] days later (not 24 h to the minute, so studying
// a little earlier the next day still finds it). Each on-time correct answer moves it
// one step on; after the last step it graduates (leaves review). A wrong answer at any
// point sends it back to the start.
export const REVIEW_STEP_DAYS = [1, 3, 7]

/** Start of the local day `days` calendar days after `now` (handles DST). */
export function dueAfterDays(now: number, days: number): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

/** Longest display name (keeps the Home greeting on one line). */
export const NAME_MAX = 10
