'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { TOPIC_COUNTS, TOTAL_QUESTIONS } from '@/lib/questionCounts'
import { TOPICS, getTopicName, isPrimaryTopic } from '@/lib/topics'
import { t, formatWhen } from '@/lib/i18n'
import NavBar from '@/components/NavBar'
import ReadinessScore from '@/components/ReadinessScore'
import StatsPanel from '@/components/StatsPanel'
import TopicCard from '@/components/TopicCard'
import AdBanner from '@/components/AdBanner'
import SplashScreen from '@/components/SplashScreen'
import LoginForm from '@/components/LoginForm'
import { IconExam, IconReview } from '@/components/icons'
import HomeCards from '@/components/HomeCards'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const { lang } = useLanguage()
  const { progress, seenCount, getDueReviews, nextReviewAt, getTopicAccuracy, readiness, topicsCovered } = useProgress()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Show the splash once per browser session, not every time Home opens.
    let seen = false
    try { seen = sessionStorage.getItem('stradeo-splash') === '1'; sessionStorage.setItem('stradeo-splash', '1') } catch { /* storage blocked */ }
    if (seen) { setShowSplash(false); return }
    const timer = setTimeout(() => setShowSplash(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash) return <SplashScreen />
  if (authLoading) return <SplashScreen />
  if (!user) return <LoginForm />

  const dueCount = getDueReviews().length
  const totalC = Object.values(progress.stats).reduce((a, s) => a + s.c, 0)
  const totalW = Object.values(progress.stats).reduce((a, s) => a + (s.t - s.c), 0)
  const totalRemaining = Math.max(0, TOTAL_QUESTIONS - seenCount())

  return (
    <div className="min-h-screen">
      <AdBanner />
      <NavBar />
      <div className="max-w-[640px] mx-auto px-4 pt-5 pb-10 animate-fade-in">
        {/* Greeting: changes with how long it's been since the last practice */}
        <Greeting name={user.name || user.email?.split('@')[0] || ''} lastStudy={progress.lastStudy} />

        {/* Readiness → Stats (swipe) */}
        <HomeCards cards={[
          { label: t(lang, 'readinessCard'), content: (
            <ReadinessScore
              readiness={readiness}
              totalCorrect={totalC}
              totalWrong={totalW}
              totalRemaining={totalRemaining}
              topicsCovered={topicsCovered}
            />
          ) },
          { label: t(lang, 'stats'), content: <StatsPanel /> },
        ]} />

        {/* Exam Button */}
        <Link
          href="/exam"
          className="flex w-full p-4 rounded-[10px] inline-flex items-center justify-center gap-2 bg-stradeo-brand text-stradeo-onbrand text-[15px] font-bold mb-2.5"
        ><IconExam size={18} />{t(lang, 'examSim')}</Link>

        {/* Smart Review */}
        {progress.wrongQuestions.length > 0 && (
          <Link
            href="/quiz?mode=review"
            className="flex w-full p-4 rounded-[10px] inline-flex items-center justify-center gap-2 border border-stradeo-line bg-stradeo-bg2 text-stradeo-ink text-[15px] font-semibold mb-2.5"
          >
            <IconReview size={18} />
            {t(lang, 'smartReview')}
            {dueCount > 0
              ? <span className="font-mono text-[13px] px-1.5 py-0.5 rounded-md bg-stradeo-ink text-stradeo-bg">{dueCount} {t(lang, 'qDue')}</span>
              : <span className="text-[13px] font-normal text-stradeo-inkdim">· {t(lang, 'nothingDue')}{nextReviewAt ? ` · ${t(lang, 'nextReview')} ${formatWhen(nextReviewAt, lang)}` : ''}</span>}
          </Link>
        )}

        {/* Topics */}
        <div className="text-[13px] font-semibold text-stradeo-inkdim uppercase tracking-[1.5px] mb-3 mt-5">
          {t(lang, 'topicsTitle')}
        </div>
        {TOPICS.map(topic => (
          <TopicCard
            key={topic.id}
            topic={topic}
            count={TOPIC_COUNTS[topic.id] || 0}
            accuracy={getTopicAccuracy(topic.id)}
            done={seenCount(topic.id)}
          />
        ))}
      </div>
    </div>
  )
}

// Calendar days between the last study day (YYYY-MM-DD, local) and today.
function daysSince(lastStudy: string | null): number | null {
  if (!lastStudy) return null
  const [y, m, d] = lastStudy.split('-').map(Number)
  const then = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((today.getTime() - then.getTime()) / 86_400_000))
}

function Greeting({ name, lastStudy }: { name: string; lastStudy: string | null }) {
  const { lang } = useLanguage()
  const days = daysSince(lastStudy)
  const key = days === null ? 'greetNew'
    : days === 0 ? 'greetToday'
    : days === 1 ? 'greetYesterday'
    : days < 7 ? 'greetDays'
    : days < 30 ? 'greetWeeks'
    : 'greetLong'
  const when = days === null ? null : new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-days, 'day')
  return (
    <div className="mb-4">
      <p className="text-[15px] text-stradeo-inkdim">
        {t(lang, key)}, <strong className="font-semibold text-stradeo-ink">{name}</strong>
      </p>
      <p className="text-[12px] text-stradeo-inkfaint mt-0.5">
        {when ? `${t(lang, 'lastPractice')}: ${when}` : t(lang, 'firstPractice')}
      </p>
    </div>
  )
}
