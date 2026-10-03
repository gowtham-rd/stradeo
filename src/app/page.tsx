'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { loadQuestions, getTopicQuestionCount, shuffle, getTopicQuestions, buildExamQuestions } from '@/lib/questions'
import { TOPICS, getTopicName, isPrimaryTopic } from '@/lib/topics'
import { t, formatWhen } from '@/lib/i18n'
import type { Question } from '@/types'
import NavBar from '@/components/NavBar'
import ReadinessScore from '@/components/ReadinessScore'
import StatsPanel from '@/components/StatsPanel'
import TopicCard from '@/components/TopicCard'
import AdBanner from '@/components/AdBanner'
import SplashScreen from '@/components/SplashScreen'
import LoginForm from '@/components/LoginForm'
import { IconStreak, IconStats, IconExam, IconReview } from '@/components/icons'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const { lang } = useLanguage()
  const { progress, getDueReviews, nextReviewAt, getTopicAccuracy, readiness, topicsCovered } = useProgress()
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
            {t(lang, 'welcome')}, <strong className="font-semibold text-stradeo-ink">{user.email?.split('@')[0]}</strong>
          </p>
          <div className="flex items-center gap-3">
            {progress.streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-stradeo-line bg-stradeo-bg2">
                <IconStreak size={16} className="text-stradeo-brandorange" />
                <span className="font-mono text-sm text-stradeo-ink">{progress.streak}</span>
              </div>
            )}
            <button
              onClick={() => setShowStats(!showStats)}
              aria-label="Stats" aria-pressed={showStats}
              className="px-2.5 py-1.5 rounded-lg border border-stradeo-line bg-stradeo-surface2 text-stradeo-inkdim hover:text-stradeo-ink"
            ><IconStats size={16} /></button>
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
          topicsCovered={topicsCovered}
        />

        {/* Exam Button */}
        <a
          href="/exam"
          className="flex w-full p-4 rounded-[10px] inline-flex items-center justify-center gap-2 bg-stradeo-brand text-stradeo-onbrand text-[15px] font-bold mb-2.5"
        ><IconExam size={18} />{t(lang, 'examSim')}</a>

        {/* Smart Review */}
        {progress.wrongQuestions.length > 0 && (
          <a
            href="/quiz?mode=review"
            className="flex w-full p-4 rounded-[10px] inline-flex items-center justify-center gap-2 border border-stradeo-line bg-stradeo-bg2 text-stradeo-ink text-[15px] font-semibold mb-2.5"
          >
            <IconReview size={18} />
            {t(lang, 'smartReview')}
            {dueCount > 0
              ? <span className="font-mono text-[13px] px-1.5 py-0.5 rounded-md bg-stradeo-ink text-stradeo-bg">{dueCount} {t(lang, 'qDue')}</span>
              : <span className="text-[13px] font-normal text-stradeo-inkdim">· {t(lang, 'nothingDue')}{nextReviewAt ? ` · ${t(lang, 'nextReview')} ${formatWhen(nextReviewAt, lang)}` : ''}</span>}
          </a>
        )}

        {/* Topics */}
        <div className="text-[13px] font-semibold text-stradeo-inkdim uppercase tracking-[1.5px] mb-3 mt-5">
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
