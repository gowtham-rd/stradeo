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
  getDueReviews: () => Question[]
  getTopicAccuracy: (topicId: number) => number | null
  readiness: number
}

const ProgressContext = createContext<ProgressContextType | null>(null)

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

      // Streak
      const today = new Date().toLocaleDateString('sv') // YYYY-MM-DD in local TZ
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv')
      let newStreak = prev.streak
      if (prev.lastStudy !== today) {
        newStreak = prev.lastStudy === yesterday ? prev.streak + 1 : 1
      }

      // Daily log
      const newDaily = { ...prev.dailyLog }
      if (!newDaily[today]) newDaily[today] = { c: 0, w: 0, total: 0 }
      newDaily[today].total++
      newDaily[today][correct ? 'c' : 'w']++

      const updated: UserProgress = {
        stats: newStats,
        totalDone: prev.totalDone + 1,
        wrongQuestions: newWrong,
        srData: newSRData,
        streak: newStreak,
        lastStudy: today,
        dailyLog: newDaily,
      }

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
    <ProgressContext.Provider value={{ progress, recordAnswer, getDueReviews, getTopicAccuracy, readiness }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
