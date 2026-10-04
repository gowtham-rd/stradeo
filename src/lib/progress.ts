// Pure progress logic — no React, no Supabase — so it can be unit-tested.
import type { UserProgress, Question, ExamRecord } from '@/types'
import { REVIEW_STEP_DAYS, dueAfterDays } from './constants'
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
  exams: [],
  applied: [],
}

/** How many saved event ids each snapshot remembers (enough for any offline backlog). */
export const APPLIED_MAX = 500
/** Short unique id for an answer/exam event. */
export function newEventId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const EXAM_HISTORY_MAX = 50

/** A single answer, kept until the server has confirmed it (replayed on conflicts).
 *  `id` makes it idempotent: an event already in the snapshot's `applied` is skipped. */
export interface PendingAnswer {
  id?: string
  question: Question
  correct: boolean
  at: number
}
/** A finished exam, kept until the server has confirmed it. */
export interface PendingExam {
  id?: string
  exam: ExamRecord
  at: number
}
export type PendingEvent = PendingAnswer | PendingExam

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
  // The applied-event ids ride along inside the `seen` column under a reserved key.
  for (const [t, ids] of Object.entries(row.seen || {})) if (t !== APPLIED_KEY && Array.isArray(ids)) seen[Number(t)] = ids as string[]
  const applied = Array.isArray(row.seen?.[APPLIED_KEY]) ? (row.seen[APPLIED_KEY] as string[]) : []
  return {
    stats: row.stats || {},
    totalDone: row.total_done || 0,
    ...normaliseReview(row.wrong_questions || [], row.sr_data || {}),
    streak: row.streak || 0,
    lastStudy: row.last_study ?? null,
    dailyLog: row.daily_log || {},
    seen,
    exams: Array.isArray(row.exams) ? (row.exams as ExamRecord[]).filter(isExamRecord) : [],
    applied,
  }
}

const APPLIED_KEY = '_applied'

function isExamRecord(e: unknown): e is ExamRecord {
  const x = e as ExamRecord
  return !!x && typeof x.at === 'number' && typeof x.score === 'number' && Array.isArray(x.ids) && typeof x.ans === 'string'
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
    seen: { ...p.seen, [APPLIED_KEY]: p.applied ?? [] },
    exams: p.exams,
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
    srData[key] = { stage: 0, next: dueAfterDays(now, REVIEW_STEP_DAYS[0]) }
  } else if (inReview) {
    const entry = prev.srData[key]
    if (!entry || now >= entry.next) {
      // On-time correct answer: move one step on, or graduate after the last step.
      const stage = (entry?.stage ?? 0) + 1
      if (stage >= REVIEW_STEP_DAYS.length) {
        wrongQuestions = prev.wrongQuestions.filter(w => questionKey(w) !== key)
        delete srData[key]
      } else {
        srData[key] = { stage, next: dueAfterDays(now, REVIEW_STEP_DAYS[stage]) }
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
    exams: prev.exams || [],
  }
}

/** Add a finished exam to the history (idempotent by `at`; keeps the newest EXAM_HISTORY_MAX). */
export function applyExam(prev: UserProgress, exam: ExamRecord): UserProgress {
  const exams = [...(prev.exams || []).filter(e => e.at !== exam.at), exam]
    .sort((a, b) => a.at - b.at)
    .slice(-EXAM_HISTORY_MAX)
  return { ...prev, exams }
}

/** Build the stored record for an exam. */
export function makeExamRecord(questions: Question[], answers: Record<number, boolean>, at: number, secs: number): ExamRecord {
  return {
    at,
    score: questions.filter((q, i) => answers[i] === q.a).length,
    total: questions.length,
    secs: Math.max(0, Math.round(secs)),
    ids: questions.map(q => seenId(q)),
    ans: questions.map((_, i) => (i in answers ? (answers[i] ? 'T' : 'F') : '-')).join(''),
  }
}

/** Replay events (oldest first) on top of a server snapshot. */
export function replay(base: UserProgress, events: PendingEvent[]): UserProgress {
  return events.reduce((acc, e) => {
    // Already in this snapshot (saved by another tab, or a save whose reply was lost).
    if (e.id && acc.applied?.includes(e.id)) return acc
    const next = 'exam' in e ? applyExam(acc, e.exam) : applyAnswer(acc, e.question, e.correct, e.at)
    return e.id ? { ...next, applied: [...(acc.applied ?? []), e.id].slice(-APPLIED_MAX) } : next
  }, base)
}

/** Events not yet contained in `snapshot` (by id). */
export function unapplied(snapshot: UserProgress, events: PendingEvent[]): PendingEvent[] {
  const done = new Set(snapshot.applied ?? [])
  return events.filter(e => !e.id || !done.has(e.id))
}
