import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_PROGRESS, applyAnswer, nextBestTopic, topicScore, replay, normaliseReview, computeReadiness, activeStreak, seenId, seenCount, fromRow, toRow,
} from '../src/lib/progress'
import { questionKey, buildExamQuestions } from '../src/lib/questions'
import { REVIEW_STEPS_MS } from '../src/lib/constants'
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
  assert.equal(entry(p, A).next, T0 + REVIEW_STEPS_MS[0])
  p = applyAnswer(p, A, true, T0 + 1 * DAY)
  assert.deepEqual(entry(p, A), { stage: 1, next: T0 + 1 * DAY + REVIEW_STEPS_MS[1] })
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
  assert.deepEqual(entry(p, A), { stage: 0, next: T0 + 4 * DAY + REVIEW_STEPS_MS[0] })
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
