'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { loadQuestions, getTopicQuestionCount, shuffle, getTopicQuestions, buildExamQuestions } from '@/lib/questions'
import { TOPICS, getTopicName, isPrimaryTopic } from '@/lib/topics'
import { t } from '@/lib/i18n'
import type { Question } from '@/types'
import NavBar from '@/components/NavBar'
import ReadinessScore from '@/components/ReadinessScore'
import StatsPanel from '@/components/StatsPanel'
import TopicCard from '@/components/TopicCard'
import AdBanner from '@/components/AdBanner'
import SplashScreen from '@/components/SplashScreen'
import LoginForm from '@/components/LoginForm'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const { lang } = useLanguage()
  const { progress, getDueReviews, getTopicAccuracy, readiness } = useProgress()
  const [questions, setQuestions] = useState<Question[]>([])
  const [showStats, setShowStats] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    loadQuestions().then(setQuestions)
    const timer = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash) return <SplashScreen />
  if (authLoading) return <SplashScreen />
  if (!user) return <LoginForm />

  const topicCounts = getTopicQuestionCount(questions)
  const dueCount = getDueReviews().length
  const totalC = Object.values(progress.stats).reduce((a, s) => a + s.c, 0)
  const totalW = Object.values(progress.stats).reduce((a, s) => a + (s.t - s.c), 0)
  const totalRemaining = 7139 - totalC - totalW

  return (
    <div className="min-h-screen">
      <AdBanner />
      <NavBar />
      <div className="max-w-[640px] mx-auto px-4 pt-5 pb-10 animate-fade-in">
        {/* Welcome + Streak */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-stradeo-inkdim">
            {t(lang, 'welcome')}, <strong className="text-stradeo-accent">{user.email?.split('@')[0]}</strong>
          </p>
          <div className="flex items-center gap-3">
            {progress.streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/[0.08] border border-orange-500/[0.15]">
                <span className="text-base">🔥</span>
                <span className="text-sm font-bold text-stradeo-accent">{progress.streak}</span>
              </div>
            )}
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-1.5 rounded-lg border border-stradeo-line bg-stradeo-surface2 text-stradeo-inkdim text-xs font-semibold"
            >📊</button>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && <StatsPanel />}

        {/* Readiness Score */}
        <ReadinessScore
          readiness={readiness}
          totalCorrect={totalC}
          totalWrong={totalW}
          totalRemaining={totalRemaining}
        />

        {/* Exam Button */}
        <a
          href="/exam"
          className="block w-full p-4 rounded-[14px] text-center bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 text-white text-[15px] font-bold shadow-[0_4px_24px_rgba(249,115,22,0.25)] mb-2.5"
        >🎯 {t(lang, 'examSim')}</a>

        {/* Smart Review */}
        {(progress.wrongQuestions.length > 0 || dueCount > 0) && (
          <a
            href="/quiz?mode=review"
            className="block w-full p-4 rounded-[14px] text-center border-2 border-stradeo-blue bg-indigo-500/[0.06] text-stradeo-blue text-[15px] font-bold mb-2.5"
          >🧠 {t(lang, 'smartReview')} ({dueCount || progress.wrongQuestions.length} {t(lang, 'qDue')})</a>
        )}

        {/* Topics */}
        <div className="text-[13px] font-bold text-stradeo-inkdim uppercase tracking-[1.5px] mb-3 mt-2.5">
          {t(lang, 'topicsTitle')}
        </div>
        {TOPICS.map(topic => (
          <TopicCard
            key={topic.id}
            topic={topic}
            count={topicCounts[topic.id] || 0}
            accuracy={getTopicAccuracy(topic.id)}
            done={progress.stats[topic.id]?.t || 0}
          />
        ))}
      </div>
    </div>
  )
}
