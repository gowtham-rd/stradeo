'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import type { UserProgress, Question, TopicStats, DayStats, SRData } from '@/types'
import { REVIEW_STEPS_MS } from '@/lib/constants'
import { questionKey } from '@/lib/questions'

const DEFAULT_PROGRESS: UserProgress = {
  stats: {},
  totalDone: 0,
  wrongQuestions: [],
  srData: {},
  streak: 0,
  lastStudy: null,
  dailyLog: {},
}

interface ProgressContextType {
  progress: UserProgress
  /** True once the user's saved progress has been fetched. */
  loaded: boolean
  /** Progress couldn't be fetched; answering is blocked until retryLoad succeeds. */
  loadError: boolean
  /** The last save failed (offline, session expired…). */
  saveError: boolean
  retryLoad: () => void
  recordAnswer: (question: Question, correct: boolean) => void
  recordAnswers: (entries: { question: Question; correct: boolean }[]) => void
  getDueReviews: () => Question[]
  /** Epoch ms of the next review that isn't due yet, or null if none. */
  nextReviewAt: number | null
  /** Current streak, 0 if it has lapsed. */
  streak: number
  getTopicAccuracy: (topicId: number) => number | null
  readiness: number
  topicsCovered: number
}

// Exam readiness, modelled on the real exam: topics 1–15 supply 2 questions each,
// topics 16–25 supply 1 each. Each topic scores correct / max(answered, MIN), so a
// topic you have barely practised can't look mastered. The total is the
// exam-weighted average across all 25 topics; 90%+ ≈ the pass mark (max 3 errors / 30).
export const READINESS_MIN_ANSWERS = 20

export function computeReadiness(stats: UserProgress['stats']): { readiness: number; topicsCovered: number } {
  let score = 0
  let weight = 0
  let covered = 0
  for (let t = 1; t <= 25; t++) {
    const w = t <= 15 ? 2 : 1
    const s = stats[t] || { c: 0, t: 0 }
    score += w * (s.c / Math.max(s.t, READINESS_MIN_ANSWERS))
    weight += w
    if (s.t >= READINESS_MIN_ANSWERS) covered++
  }
  return { readiness: Math.min(100, Math.round((score / weight) * 100)), topicsCovered: covered }
}

// Bring stored review data up to the current format: unique keys, one entry per
// question, no orphans. Entries from the old 40-character keys are dropped and
// their questions start fresh (due now).
export function normaliseReview(wrong: Question[], sr: Record<string, unknown>): Pick<UserProgress, 'wrongQuestions' | 'srData'> {
  const seen = new Set<string>()
  const wrongQuestions: Question[] = []
  const srData: UserProgress['srData'] = {}
  for (const q of wrong) {
    const k = questionKey(q)
    if (seen.has(k)) continue
    seen.add(k)
    wrongQuestions.push(q)
    const e = sr[k] as { stage?: unknown; next?: unknown } | undefined
    srData[k] = e && typeof e.stage === 'number' && typeof e.next === 'number'
      ? { stage: e.stage, next: e.next }
      : { stage: 0, next: Date.now() }
  }
  return { wrongQuestions, srData }
}

// Calendar "yesterday" in local time (subtracting 24h breaks across DST changes).
function localYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('sv')
}

/** Streak as it stands today: it lapses if the last study day was before yesterday. */
export function activeStreak(p: Pick<UserProgress, 'streak' | 'lastStudy'>): number {
  const today = new Date().toLocaleDateString('sv')
  return p.lastStudy === today || p.lastStudy === localYesterday() ? p.streak : 0
}

const ProgressContext = createContext<ProgressContextType | null>(null)

// Pure fold of one answer into a progress snapshot (no mutation of prev).
export function applyAnswer(prev: UserProgress, question: Question, correct: boolean): UserProgress {
  const topicId = question.t
  const prevStats = prev.stats[topicId] || { c: 0, t: 0 }
  const newStats = { ...prev.stats, [topicId]: { c: prevStats.c + (correct ? 1 : 0), t: prevStats.t + 1 } }

  // Smart Review (spaced repetition on missed questions)
  const now = Date.now()
  const key = questionKey(question)
  const inReview = prev.wrongQuestions.some(w => questionKey(w) === key)
  let newWrong = prev.wrongQuestions
  const newSRData = { ...prev.srData }
  if (!correct) {
    // Miss: (re)enter review at the start of the schedule.
    if (!inReview) newWrong = [...prev.wrongQuestions, question]
    newSRData[key] = { stage: 0, next: now + REVIEW_STEPS_MS[0] }
  } else if (inReview) {
    const entry = prev.srData[key]
    const due = !entry || now >= entry.next
    if (due) {
      // On-time correct answer: move one step on, or graduate after the last step.
      const stage = (entry?.stage ?? 0) + 1
      if (stage >= REVIEW_STEPS_MS.length) {
        newWrong = prev.wrongQuestions.filter(w => questionKey(w) !== key)
        delete newSRData[key]
      } else {
        newSRData[key] = { stage, next: now + REVIEW_STEPS_MS[stage] }
      }
    }
    // Correct before it's due (extra practice): schedule unchanged.
  }

  // Streak (batched answers all share one study day)
  const today = new Date().toLocaleDateString('sv')
  const yesterday = localYesterday()
  let newStreak = prev.streak
  if (prev.lastStudy !== today) {
    newStreak = prev.lastStudy === yesterday ? prev.streak + 1 : 1
  }

  // Daily log — immutable nested update
  const prevDay = prev.dailyLog[today] || { c: 0, w: 0, total: 0 }
  const newDay = { c: prevDay.c + (correct ? 1 : 0), w: prevDay.w + (correct ? 0 : 1), total: prevDay.total + 1 }
  const newDaily = { ...prev.dailyLog, [today]: newDay }

  return {
    stats: newStats,
    totalDone: prev.totalDone + 1,
    wrongQuestions: newWrong,
    srData: newSRData,
    streak: newStreak,
    lastStudy: today,
    dailyLog: newDaily,
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  // Saves are only allowed once this user's row has been read successfully,
  // so a failed or slow load can never overwrite real data with defaults.
  const loadedFor = useRef<string | null>(null)
  const saveChain = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    loadedFor.current = null
    setLoaded(false)
    setLoadError(false)
    setSaveError(false)
    if (!userId) { setProgress(DEFAULT_PROGRESS); return }
    let cancelled = false
    supabase.from('progress').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { setLoadError(true); return }
        setProgress(data ? {
          stats: data.stats || {},
          totalDone: data.total_done || 0,
          ...normaliseReview(data.wrong_questions || [], data.sr_data || {}),
          streak: data.streak || 0,
          lastStudy: data.last_study,
          dailyLog: data.daily_log || {},
        } : DEFAULT_PROGRESS)
        loadedFor.current = userId
        setLoaded(true)
      }, () => { if (!cancelled) setLoadError(true) })
    return () => { cancelled = true }
  }, [userId, reloadToken])

  const retryLoad = useCallback(() => setReloadToken(n => n + 1), [])

  // Saves run one after another so an older snapshot can't land after a newer one.
  const saveProgress = useCallback((p: UserProgress) => {
    const id = loadedFor.current
    if (!id) return
    saveChain.current = saveChain.current.then(async () => {
      try {
        const { error } = await supabase.from('progress').upsert({
          user_id: id,
          stats: p.stats,
          total_done: p.totalDone,
          wrong_questions: p.wrongQuestions,
          sr_data: p.srData,
          streak: p.streak,
          last_study: p.lastStudy,
          daily_log: p.dailyLog,
          updated_at: new Date().toISOString(),
        })
        setSaveError(!!error)
      } catch {
        setSaveError(true)
      }
    })
  }, [])

  const recordAnswer = useCallback((question: Question, correct: boolean) => {
    if (!loadedFor.current) return
    setProgress(prev => {
      const updated = applyAnswer(prev, question, correct)
      saveProgress(updated)
      return updated
    })
  }, [saveProgress])

  // Record several answers at once (e.g. an exam) as a single state update + save.
  const recordAnswers = useCallback((entries: { question: Question; correct: boolean }[]) => {
    if (!entries.length || !loadedFor.current) return
    setProgress(prev => {
      const updated = entries.reduce((acc, e) => applyAnswer(acc, e.question, e.correct), prev)
      saveProgress(updated)
      return updated
    })
  }, [saveProgress])

  const getDueReviews = useCallback((): Question[] => {
    const now = Date.now()
    return progress.wrongQuestions.filter(q => now >= (progress.srData[questionKey(q)]?.next ?? 0))
  }, [progress.wrongQuestions, progress.srData])

  const nowMs = Date.now()
  const upcoming = progress.wrongQuestions
    .map(q => progress.srData[questionKey(q)]?.next ?? 0)
    .filter(n => n > nowMs)
  const nextReviewAt = upcoming.length ? Math.min(...upcoming) : null

  const getTopicAccuracy = useCallback((topicId: number): number | null => {
    const s = progress.stats[topicId]
    if (!s || s.t === 0) return null
    return Math.round((s.c / s.t) * 100)
  }, [progress.stats])

  const { readiness, topicsCovered } = computeReadiness(progress.stats)

  return (
    <ProgressContext.Provider value={{ progress, loaded, loadError, saveError, retryLoad, recordAnswer, recordAnswers, getDueReviews, nextReviewAt, streak: activeStreak(progress), getTopicAccuracy, readiness, topicsCovered }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
