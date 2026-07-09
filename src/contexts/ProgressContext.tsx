'use client'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import type { UserProgress, Question, TopicStats, DayStats, SRData } from '@/types'
import { SR_INITIAL_INTERVAL, SR_MAX_INTERVAL, SR_MULTIPLIER } from '@/lib/constants'

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
  recordAnswer: (question: Question, correct: boolean) => void
  recordAnswers: (entries: { question: Question; correct: boolean }[]) => void
  getDueReviews: () => Question[]
  getTopicAccuracy: (topicId: number) => number | null
  readiness: number
}

const ProgressContext = createContext<ProgressContextType | null>(null)

// Pure fold of one answer into a progress snapshot (no mutation of prev).
function applyAnswer(prev: UserProgress, question: Question, correct: boolean): UserProgress {
  const topicId = question.t
  const prevStats = prev.stats[topicId] || { c: 0, t: 0 }
  const newStats = { ...prev.stats, [topicId]: { c: prevStats.c + (correct ? 1 : 0), t: prevStats.t + 1 } }

  // Spaced repetition
  const key = question.q.substring(0, 40)
  const prevSR = prev.srData[key] || { interval: SR_INITIAL_INTERVAL, next: 0, reps: 0 }
  const newInterval = correct ? Math.min(prevSR.interval * SR_MULTIPLIER, SR_MAX_INTERVAL) : SR_INITIAL_INTERVAL
  const newSRData = { ...prev.srData, [key]: { interval: newInterval, next: Date.now() + newInterval, reps: prevSR.reps + 1 } }

  // Wrong questions
  let newWrong = [...prev.wrongQuestions]
  if (!correct) {
    if (!newWrong.find(w => w.q === question.q)) newWrong.push(question)
  } else {
    newWrong = newWrong.filter(w => w.q !== question.q)
  }

  // Streak (batched answers all share one study day)
  const today = new Date().toLocaleDateString('sv')
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv')
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
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS)

  // Load progress from Supabase
  useEffect(() => {
    if (!user) { setProgress(DEFAULT_PROGRESS); return }
    supabase.from('progress').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProgress({
            stats: data.stats || {},
            totalDone: data.total_done || 0,
            wrongQuestions: data.wrong_questions || [],
            srData: data.sr_data || {},
            streak: data.streak || 0,
            lastStudy: data.last_study,
            dailyLog: data.daily_log || {},
          })
        }
      })
  }, [user])

  // Save progress to Supabase (debounced)
  const saveProgress = useCallback(async (p: UserProgress) => {
    if (!user) return
    await supabase.from('progress').upsert({
      user_id: user.id,
      stats: p.stats,
      total_done: p.totalDone,
      wrong_questions: p.wrongQuestions,
      sr_data: p.srData,
      streak: p.streak,
      last_study: p.lastStudy,
      daily_log: p.dailyLog,
      updated_at: new Date().toISOString(),
    })
  }, [user])

  const recordAnswer = useCallback((question: Question, correct: boolean) => {
    setProgress(prev => {
      const updated = applyAnswer(prev, question, correct)
      saveProgress(updated)
      return updated
    })
  }, [saveProgress])

  // Record several answers at once (e.g. an exam) as a single state update + save.
  const recordAnswers = useCallback((entries: { question: Question; correct: boolean }[]) => {
    if (!entries.length) return
    setProgress(prev => {
      const updated = entries.reduce((acc, e) => applyAnswer(acc, e.question, e.correct), prev)
      saveProgress(updated)
      return updated
    })
  }, [saveProgress])

  const getDueReviews = useCallback((): Question[] => {
    const now = Date.now()
    return progress.wrongQuestions.filter(q => {
      const key = q.q.substring(0, 40)
      const sr = progress.srData[key] || { next: 0 }
      return now >= sr.next
    })
  }, [progress.wrongQuestions, progress.srData])

  const getTopicAccuracy = useCallback((topicId: number): number | null => {
    const s = progress.stats[topicId]
    if (!s || s.t === 0) return null
    return Math.round((s.c / s.t) * 100)
  }, [progress.stats])

  const totalC = Object.values(progress.stats).reduce((a, s) => a + s.c, 0)
  const totalA = Object.values(progress.stats).reduce((a, s) => a + s.t, 0)
  const readiness = totalA > 0 ? Math.min(Math.round((totalC / totalA) * 100), 100) : 0

  return (
    <ProgressContext.Provider value={{ progress, recordAnswer, recordAnswers, getDueReviews, getTopicAccuracy, readiness }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
