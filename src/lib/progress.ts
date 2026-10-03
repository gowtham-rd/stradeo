// Pure progress logic — no React, no Supabase — so it can be unit-tested.
import type { UserProgress, Question } from '@/types'
import { REVIEW_STEPS_MS } from './constants'
import { questionKey } from './questions'

export const DEFAULT_PROGRESS: UserProgress = {
  stats: {},
  totalDone: 0,
  wrongQuestions: [],
  srData: {},
  streak: 0,
  lastStudy: null,
  dailyLog: {},
  seen: {},
}

/** A single answer, kept until the server has confirmed it (replayed on conflicts). */
export interface PendingAnswer {
  question: Question
  correct: boolean
  at: number
}

// ── Seen questions ──────────────────────────────────────────────────────────
/** Short stable id for a question (FNV-1a over questionKey, base36). Stored per topic. */
export function seenId(q: Pick<Question, 't' | 'i' | 'q'>): string {
  const s = questionKey(q)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

export function seenCount(seen: UserProgress['seen'], topic?: number): number {
  if (topic !== undefined) return seen[topic]?.length ?? 0
  return Object.values(seen).reduce((a, ids) => a + ids.length, 0)
}

// ── Dates ───────────────────────────────────────────────────────────────────
const day = (ms: number) => new Date(ms).toLocaleDateString('sv')
/** Calendar "yesterday" in local time (subtracting 24h breaks across DST changes). */
function yesterdayOf(ms: number): string {
  const d = new Date(ms)
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('sv')
}

/** Streak as it stands today: it lapses if the last study day was before yesterday. */
export function activeStreak(p: Pick<UserProgress, 'streak' | 'lastStudy'>, now = Date.now()): number {
  return p.lastStudy === day(now) || p.lastStudy === yesterdayOf(now) ? p.streak : 0
}

// ── Readiness ───────────────────────────────────────────────────────────────
// Modelled on the real exam: topics 1–15 supply 2 questions each, 16–25 one each.
// Each topic scores correct / max(answered, MIN), so thin practice can't look
// mastered. 90%+ ≈ the pass mark (max 3 errors in 30).
export const READINESS_MIN_ANSWERS = 20

export function computeReadiness(stats: UserProgress['stats']): { readiness: number; topicsCovered: number } {
  let score = 0, weight = 0, covered = 0
  for (let t = 1; t <= 25; t++) {
    const w = t <= 15 ? 2 : 1
    const s = stats[t] || { c: 0, t: 0 }
    score += w * (s.c / Math.max(s.t, READINESS_MIN_ANSWERS))
    weight += w
    if (s.t >= READINESS_MIN_ANSWERS) covered++
  }
  return { readiness: Math.min(100, Math.round((score / weight) * 100)), topicsCovered: covered }
}

/** Readiness of one topic, 0–1 (same rule as the overall score). */
export function topicScore(stats: UserProgress['stats'], topic: number): number {
  const s = stats[topic] || { c: 0, t: 0 }
  return s.c / Math.max(s.t, READINESS_MIN_ANSWERS)
}

/** The topic whose improvement raises overall readiness the most: the biggest
 *  weighted gap to 100% (topics 1–15 count double, as in the exam). */
export function nextBestTopic(stats: UserProgress['stats']): number | null {
  let best: number | null = null
  let bestGap = 0
  for (let t = 1; t <= 25; t++) {
    const gap = (t <= 15 ? 2 : 1) * (1 - topicScore(stats, t))
    if (gap > bestGap + 1e-9) { bestGap = gap; best = t }
  }
  return bestGap >= 0.1 ? best : null
}

// ── Loading stored data ─────────────────────────────────────────────────────
// Bring stored review data up to the current format: unique keys, one entry per
// question, no orphans. Entries from old key formats are dropped and those
// questions start fresh (due now).
export function normaliseReview(
  wrong: Question[], sr: Record<string, unknown>, now = Date.now(),
): Pick<UserProgress, 'wrongQuestions' | 'srData'> {
  const keys = new Set<string>()
  const wrongQuestions: Question[] = []
  const srData: UserProgress['srData'] = {}
  for (const q of wrong) {
    const k = questionKey(q)
    if (keys.has(k)) continue
    keys.add(k)
    wrongQuestions.push(q)
    const e = sr[k] as { stage?: unknown; next?: unknown } | undefined
    srData[k] = e && typeof e.stage === 'number' && typeof e.next === 'number'
      ? { stage: e.stage, next: e.next }
      : { stage: 0, next: now }
  }
  return { wrongQuestions, srData }
}

/** Database row → UserProgress. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromRow(row: any): UserProgress {
  if (!row) return DEFAULT_PROGRESS
  const seen: UserProgress['seen'] = {}
  for (const [t, ids] of Object.entries(row.seen || {})) if (Array.isArray(ids)) seen[Number(t)] = ids as string[]
  return {
    stats: row.stats || {},
    totalDone: row.total_done || 0,
    ...normaliseReview(row.wrong_questions || [], row.sr_data || {}),
    streak: row.streak || 0,
    lastStudy: row.last_study ?? null,
    dailyLog: row.daily_log || {},
    seen,
  }
}

/** UserProgress → database columns. */
export function toRow(p: UserProgress) {
  return {
    stats: p.stats,
    total_done: p.totalDone,
    wrong_questions: p.wrongQuestions,
    sr_data: p.srData,
    streak: p.streak,
    last_study: p.lastStudy,
    daily_log: p.dailyLog,
    seen: p.seen,
  }
}

// ── Answers ─────────────────────────────────────────────────────────────────
/** Pure fold of one answer into a progress snapshot. `now` is when it was answered. */
export function applyAnswer(prev: UserProgress, question: Question, correct: boolean, now = Date.now()): UserProgress {
  const topicId = question.t
  const prevStats = prev.stats[topicId] || { c: 0, t: 0 }
  const stats = { ...prev.stats, [topicId]: { c: prevStats.c + (correct ? 1 : 0), t: prevStats.t + 1 } }

  // Seen questions (unique per topic)
  const id = seenId(question)
  const topicSeen = prev.seen[topicId] || []
  const seen = topicSeen.includes(id) ? prev.seen : { ...prev.seen, [topicId]: [...topicSeen, id] }

  // Smart Review (spaced repetition on missed questions)
  const key = questionKey(question)
  const inReview = prev.wrongQuestions.some(w => questionKey(w) === key)
  let wrongQuestions = prev.wrongQuestions
  const srData = { ...prev.srData }
  if (!correct) {
    // Miss: (re)enter review at the start of the schedule.
    if (!inReview) wrongQuestions = [...prev.wrongQuestions, question]
    srData[key] = { stage: 0, next: now + REVIEW_STEPS_MS[0] }
  } else if (inReview) {
    const entry = prev.srData[key]
    if (!entry || now >= entry.next) {
      // On-time correct answer: move one step on, or graduate after the last step.
      const stage = (entry?.stage ?? 0) + 1
      if (stage >= REVIEW_STEPS_MS.length) {
        wrongQuestions = prev.wrongQuestions.filter(w => questionKey(w) !== key)
        delete srData[key]
      } else {
        srData[key] = { stage, next: now + REVIEW_STEPS_MS[stage] }
      }
    }
    // Correct before it's due (extra practice): schedule unchanged.
  }

  // Streak (answers on the same day share one study day)
  const today = day(now)
  const streak = prev.lastStudy === today ? prev.streak
    : prev.lastStudy === yesterdayOf(now) ? prev.streak + 1 : 1
  // If an older answer is replayed after a newer day was recorded, keep the newer day.
  const lastStudy = prev.lastStudy && prev.lastStudy > today ? prev.lastStudy : today

  // Daily log
  const prevDay = prev.dailyLog[today] || { c: 0, w: 0, total: 0 }
  const dailyLog = { ...prev.dailyLog, [today]: { c: prevDay.c + (correct ? 1 : 0), w: prevDay.w + (correct ? 0 : 1), total: prevDay.total + 1 } }

  return {
    stats,
    totalDone: prev.totalDone + 1,
    wrongQuestions,
    srData,
    streak: lastStudy === today ? streak : prev.streak,
    lastStudy,
    dailyLog,
    seen,
  }
}

/** Replay answers (oldest first) on top of a server snapshot. */
export function replay(base: UserProgress, answers: PendingAnswer[]): UserProgress {
  return answers.reduce((acc, a) => applyAnswer(acc, a.question, a.correct, a.at), base)
}
