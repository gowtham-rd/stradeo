import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_PROGRESS, applyAnswer, nextBestTopic, topicScore, replay, normaliseReview, computeReadiness, activeStreak, seenId, seenCount, fromRow, toRow, applyExam, makeExamRecord, EXAM_HISTORY_MAX,
} from '../src/lib/progress'
import { questionKey, buildExamQuestions } from '../src/lib/questions'
import { REVIEW_STEP_DAYS, dueAfterDays } from '../src/lib/constants'
import { TOTAL_QUESTIONS, TOPIC_COUNTS } from '../src/lib/questionCounts'
import type { Question } from '../src/types'

const DAY = 86_400_000
const T0 = new Date('2026-10-05T10:00:00').getTime()
// Same wording, different sign: must be tracked separately.
const A: Question = { t: 2, i: '/img_sign/1.png', q: 'Il segnale raffigurato è un segnale di pericolo', a: true }
const B: Question = { t: 2, i: '/img_sign/2.png', q: 'Il segnale raffigurato è un segnale di pericolo', a: false }
const entry = (p: typeof DEFAULT_PROGRESS, q: Question) => p.srData[questionKey(q)]
const inReview = (p: typeof DEFAULT_PROGRESS, q: Question) => p.wrongQuestions.some(w => questionKey(w) === questionKey(q))

test('questions with the same text but a different sign are distinct', () => {
  assert.notEqual(questionKey(A), questionKey(B))
  assert.notEqual(seenId(A), seenId(B))
})

test('smart review: miss → 1d → 3d → 7d → graduates', () => {
  let p = applyAnswer(DEFAULT_PROGRESS, A, false, T0)
  assert.equal(entry(p, A).next, dueAfterDays(T0, REVIEW_STEP_DAYS[0]))
  p = applyAnswer(p, A, true, T0 + 1 * DAY)
  assert.deepEqual(entry(p, A), { stage: 1, next: dueAfterDays(T0 + 1 * DAY, REVIEW_STEP_DAYS[1]) })
  p = applyAnswer(p, A, true, T0 + 4 * DAY)
  assert.equal(entry(p, A).stage, 2)
  p = applyAnswer(p, A, true, T0 + 11 * DAY)
  assert.equal(inReview(p, A), false)
  assert.equal(entry(p, A), undefined)
})

test('smart review: early correct answer does not move the schedule', () => {
  let p = applyAnswer(DEFAULT_PROGRESS, A, false, T0)
  const before = entry(p, A)
  p = applyAnswer(p, A, true, T0 + 60_000)
  assert.deepEqual(entry(p, A), before)
})

test('smart review: a miss resets to the start', () => {
  let p = applyAnswer(DEFAULT_PROGRESS, A, false, T0)
  p = applyAnswer(p, A, true, T0 + DAY)
  p = applyAnswer(p, A, false, T0 + 4 * DAY)
  assert.deepEqual(entry(p, A), { stage: 0, next: dueAfterDays(T0 + 4 * DAY, REVIEW_STEP_DAYS[0]) })
})

test('smart review: answering one sign never removes another with the same text', () => {
  let p = applyAnswer(DEFAULT_PROGRESS, A, false, T0)
  p = applyAnswer(p, B, false, T0)
  for (let d = 1; d <= 20; d++) p = applyAnswer(p, B, true, T0 + d * DAY)
  assert.equal(inReview(p, A), true)
  assert.equal(inReview(p, B), false)
})

test('normaliseReview drops old keys, dedupes, and makes legacy mistakes due', () => {
  const n = normaliseReview([A, A, B], { 'Il segnale raffigurato è un segnale di pe': { interval: 1 } }, T0)
  assert.equal(n.wrongQuestions.length, 2)
  assert.ok(Object.values(n.srData).every(e => e.stage === 0 && e.next === T0))
})

test('seen counts unique questions, not answers', () => {
  let p = DEFAULT_PROGRESS
  for (let i = 0; i < 5; i++) p = applyAnswer(p, A, i % 2 === 0, T0 + i)
  p = applyAnswer(p, B, true, T0)
  assert.equal(seenCount(p.seen), 2)
  assert.equal(seenCount(p.seen, 2), 2)
  assert.equal(p.stats[2].t, 6)
})

test('streak: consecutive days grow it, a gap resets it, a lapsed streak reads 0', () => {
  let p = applyAnswer(DEFAULT_PROGRESS, A, true, T0)
  p = applyAnswer(p, A, true, T0 + DAY)
  p = applyAnswer(p, A, true, T0 + DAY + 1000) // same day: unchanged
  assert.equal(p.streak, 2)
  assert.equal(activeStreak(p, T0 + 2 * DAY), 2)
  assert.equal(activeStreak(p, T0 + 3 * DAY), 0)
  p = applyAnswer(p, A, true, T0 + 5 * DAY)
  assert.equal(p.streak, 1)
})

test('streak survives the DST change (25 Oct 2026, Europe)', () => {
  const sat = new Date('2026-10-24T23:30:00').getTime()
  const sun = new Date('2026-10-25T23:30:00').getTime()
  const p = applyAnswer(applyAnswer(DEFAULT_PROGRESS, A, true, sat), A, true, sun)
  assert.equal(p.streak, 2)
})

test('sync: pending answers replayed on another device\'s newer snapshot keep both', () => {
  // Device 1 saved answer X; device 2 (offline) answered Y on the old snapshot.
  const X: Question = { t: 5, q: 'X', a: true }
  const Y: Question = { t: 7, q: 'Y', a: false }
  const server = applyAnswer(DEFAULT_PROGRESS, X, true, T0)
  const merged = replay(server, [{ question: Y, correct: false, at: T0 + 10 }])
  assert.equal(merged.totalDone, 2)
  assert.equal(merged.stats[5].c, 1)
  assert.equal(merged.stats[7].t, 1)
  assert.equal(inReview(merged, Y), true)
})

test('row round-trip keeps everything', () => {
  let p = applyAnswer(DEFAULT_PROGRESS, A, false, T0)
  p = applyAnswer(p, B, true, T0)
  const back = fromRow({ ...toRow(p), version: 3 })
  assert.deepEqual(back.stats, p.stats)
  assert.deepEqual(back.seen, p.seen)
  assert.deepEqual(back.srData, p.srData)
  assert.equal(back.wrongQuestions.length, 1)
})

test('readiness: nothing → 0, thin practice stays low, full mastery → 100', () => {
  assert.deepEqual(computeReadiness({}), { readiness: 0, topicsCovered: 0 })
  assert.ok(computeReadiness({ 1: { c: 5, t: 5 } }).readiness < 5)
  const all = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [i + 1, { c: 20, t: 20 }]))
  assert.deepEqual(computeReadiness(all), { readiness: 100, topicsCovered: 25 })
})

const bank: Question[] = JSON.parse(readFileSync('public/data/questions.json', 'utf8'))

test('question data: counts file matches the bank, every question is well-formed', () => {
  assert.equal(TOTAL_QUESTIONS, bank.length)
  for (let t = 1; t <= 25; t++) assert.equal(TOPIC_COUNTS[t], bank.filter(q => q.t === t).length)
  for (const q of bank) {
    assert.ok(q.q.trim().length > 0)
    assert.equal(typeof q.a, 'boolean')
    assert.ok(q.t >= 1 && q.t <= 25)
  }
})

test('exam: always 30 questions, max 2 per topic, no duplicates', () => {
  for (let run = 0; run < 50; run++) {
    const exam = buildExamQuestions(bank)
    assert.equal(exam.length, 30)
    assert.equal(new Set(exam.map(questionKey)).size, 30)
    const per: Record<number, number> = {}
    for (const q of exam) per[q.t] = (per[q.t] || 0) + 1
    assert.ok(Object.entries(per).every(([t, n]) => n <= (Number(t) <= 15 ? 2 : 1)))
  }
})

test('next best topic: weighted biggest gap, none when everything is ready', () => {
  const all = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [i + 1, { c: 20, t: 20 }]))
  assert.equal(nextBestTopic(all), null)
  // Topic 3 (double weight) at 50% beats topic 20 (single weight) at 0%.
  assert.equal(nextBestTopic({ ...all, 3: { c: 10, t: 20 }, 20: { c: 0, t: 20 } }), 3)
  // From nothing, the first double-weight topic wins.
  assert.equal(nextBestTopic({}), 1)
  assert.equal(topicScore({ 5: { c: 5, t: 5 } }, 5), 0.25)
})

test('exam history: record, replay is idempotent, capped, survives a row round-trip', () => {
  const qs = [A, B, { ...A, q: 'altra domanda', a: false }]
  const rec = makeExamRecord(qs, { 0: true, 1: true }, T0, 125.4)
  assert.equal(rec.score, 1)
  assert.equal(rec.ans, 'TT-')
  assert.equal(rec.secs, 125)
  assert.deepEqual(rec.ids, qs.map(seenId))
  let p = replay(DEFAULT_PROGRESS, [{ exam: rec, at: T0 }, { exam: rec, at: T0 }])
  assert.equal(p.exams.length, 1)
  for (let i = 1; i <= EXAM_HISTORY_MAX + 5; i++) p = applyExam(p, { ...rec, at: T0 + i })
  assert.equal(p.exams.length, EXAM_HISTORY_MAX)
  assert.equal(p.exams[p.exams.length - 1].at, T0 + EXAM_HISTORY_MAX + 5)
  assert.deepEqual(fromRow({ ...toRow(p) }).exams, p.exams)
  // Answers keep the history; rows from before migration 003 load with none.
  assert.equal(applyAnswer(p, A, true, T0).exams.length, EXAM_HISTORY_MAX)
  assert.deepEqual(fromRow({ stats: {} }).exams, [])
})

test('plan: days until the exam and the daily goal', async () => {
  const { daysUntil, dailyGoal, GOAL_DEFAULT, GOAL_MIN, GOAL_MAX } = await import('../src/lib/plan')
  const now = new Date('2026-10-04T23:30:00')
  assert.equal(daysUntil('2026-10-04', now), 0)
  assert.equal(daysUntil('2026-10-22', now), 18)
  assert.equal(daysUntil('2026-10-01', now), -3)
  assert.equal(daysUntil(null, now), null)
  assert.equal(daysUntil('soon', now), null)
  assert.equal(dailyGoal(6776, null), GOAL_DEFAULT)
  assert.equal(dailyGoal(6776, 0), GOAL_DEFAULT)
  assert.equal(dailyGoal(6776, 10), GOAL_MAX)
  assert.equal(dailyGoal(100, 30), GOAL_MIN)
  assert.equal(dailyGoal(2000, 30), 70) // 66.7 → 70
})

test('smart review: due from the start of the calendar day, not 24 h to the minute', () => {
  const missed = new Date(2026, 9, 5, 9, 5).getTime() // Mon 09:05
  const p = applyAnswer(DEFAULT_PROGRESS, A, false, missed)
  const next = entry(p, A).next
  assert.equal(next, new Date(2026, 9, 6, 0, 0).getTime())
  assert.ok(new Date(2026, 9, 6, 9, 0).getTime() >= next) // Tue 09:00 → already due
})

test('sync: replaying an event the snapshot already has is a no-op (no double count)', async () => {
  const { unapplied } = await import('../src/lib/progress')
  const ev = { id: 'ev1', question: A, correct: false, at: T0 }
  const once = replay(DEFAULT_PROGRESS, [ev])
  const twice = replay(once, [ev])
  assert.equal(twice.totalDone, 1)
  assert.deepEqual(twice.stats, once.stats)
  assert.deepEqual(unapplied(once, [ev]), [])
  // ids survive the database round-trip and don't leak into `seen`
  const back = fromRow({ ...toRow(once) })
  assert.deepEqual(back.applied, ['ev1'])
  assert.equal(seenCount(back.seen), 1)
  assert.equal(replay(back, [ev]).totalDone, 1)
})

test('study button: in order, stays until done, then moves on; best gain once all started', async () => {
  const { studyTarget } = await import('../src/lib/plan')
  const count = () => 100
  const base = { count, bestGain: 7 }
  // newbie
  assert.equal(studyTarget({ ...base, last: null, seen: () => 0, accuracy: () => null }), 1)
  // half-way through topic 1
  assert.equal(studyTarget({ ...base, last: 1, seen: t => (t === 1 ? 40 : 0), accuracy: () => 70 }), 1)
  // topic 1 finished → topic 2
  assert.equal(studyTarget({ ...base, last: 1, seen: t => (t === 1 ? 96 : 0), accuracy: () => 70 }), 2)
  // half answered with 92% also counts as done
  assert.equal(studyTarget({ ...base, last: 1, seen: t => (t === 1 ? 50 : 0), accuracy: t => (t === 1 ? 92 : null) }), 2)
  // jumped to topic 5 and finished it → 6 (not back to 1)
  assert.equal(studyTarget({ ...base, last: 5, seen: t => (t === 5 ? 100 : 0), accuracy: () => null }), 6)
  // every topic started → biggest gain
  assert.equal(studyTarget({ ...base, last: 3, seen: () => 10, accuracy: () => 60 }), 7)
})

test('home greeting: salutation by hour, exam day first, milestones, reviews after a break', async () => {
  const { salutation, homeLine, reachedMilestones } = await import('../src/lib/greeting')
  assert.equal(salutation(8), 'helloMorning'); assert.equal(salutation(13), 'helloAfternoon')
  assert.equal(salutation(20), 'helloEvening'); assert.equal(salutation(2), 'helloNight')
  const now = new Date(2026, 9, 5, 19, 0)
  const base = { lastStudy: '2026-10-05', readiness: 60, streak: 2, dueCount: 0, examDaysLeft: 20, milestone: null, now, goal: 30, doneToday: 0, unseen: 5000 }
  assert.equal(homeLine({ ...base, examDaysLeft: 0 }).key, 'gExamDay')
  assert.equal(homeLine({ ...base, examDaysLeft: 1 }).key, 'gExamTomorrow')
  assert.equal(homeLine({ ...base, examDaysLeft: -2 }).key, 'gExamOver')
  const ms = reachedMilestones({ totalDone: 120, readiness: 50, examPassed: false })
  assert.deepEqual(ms.map(m => m.id), ['q100'])
  assert.deepEqual(homeLine({ ...base, milestone: ms[0] }), { key: 'gMilestoneQ', n: 100 })
  assert.deepEqual(homeLine({ ...base, lastStudy: '2026-10-01', dueCount: 6 }), { key: 'gBackReviews', n: 6 })
})

test('home greeting: lines carry real numbers (goal, left today, countdown, readiness)', async () => {
  const { homeLine } = await import('../src/lib/greeting')
  const now = new Date(2026, 9, 5, 21, 0)
  const base = { lastStudy: '2026-10-04', readiness: 60, streak: 1, dueCount: 0, examDaysLeft: null, milestone: null, now, goal: 30, doneToday: 0, unseen: 5000 }
  // brand new: total questions and today's goal
  assert.deepEqual(homeLine({ ...base, lastStudy: null, unseen: 7106 }), { key: 'gNew', n: 30, m: 7106 })
  // part-way through today, then done
  assert.deepEqual(homeLine({ ...base, doneToday: 12 }), { key: 'gToGo', n: 18 })
  assert.deepEqual(homeLine({ ...base, doneToday: 34 }), { key: 'gGoalDone', n: 30 })
  // ready
  assert.deepEqual(homeLine({ ...base, readiness: 93 }), { key: 'gReady', n: 93 })
  // nothing special: the evening line with the goal
  assert.deepEqual(homeLine(base), { key: 'gEvening', n: 30 })
  // with an exam date the countdown joins the rotation
  const seen = new Set<string>()
  for (let h = 6; h < 22; h++) seen.add(homeLine({ ...base, examDaysLeft: 24, now: new Date(2026, 9, 5, h) }).key)
  assert.ok(seen.has('gCountdown'))
})
