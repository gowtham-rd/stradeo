'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { TOPIC_COUNTS, TOTAL_QUESTIONS } from '@/lib/questionCounts'
import { TOPICS, getTopicName, isPrimaryTopic } from '@/lib/topics'
import { t, formatWhen, type UIKey } from '@/lib/i18n'
import { daysSince, greetingLine } from '@/lib/greeting'
import NavBar from '@/components/NavBar'
import ReadinessScore, { TopicMapCard } from '@/components/ReadinessScore'
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
  const { progress, seenCount, getDueReviews, nextReviewAt, getTopicAccuracy, readiness, topicsCovered, streak } = useProgress()
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
      <div className="max-w-[640px] mx-auto px-4 pt-4 pb-10 animate-fade-in">
        {/* Greeting: name, then a line for the time of day / how it's going */}
        <Greeting name={user.name || user.email?.split('@')[0] || ''} lastStudy={progress.lastStudy} readiness={readiness} streak={streak} />

        {/* Readiness → Topic map → Stats (swipe; the strip takes the height of the card in view) */}
        <HomeCards className="mb-4" cards={[
          { label: t(lang, 'readinessCard'), content: (
            <ReadinessScore
              readiness={readiness}
              totalCorrect={totalC}
              totalWrong={totalW}
              totalRemaining={totalRemaining}
            />
          ) },
          { label: t(lang, 'topicMap'), content: <TopicMapCard topicsCovered={topicsCovered} /> },
          { label: t(lang, 'stats'), content: <StatsPanel /> },
        ]} />

        {/* Exam Button */}
        <Link
          href="/exam"
          className="flex w-full items-center justify-center gap-2 p-4 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-[15px] font-bold mb-2.5"
        ><IconExam size={18} />{t(lang, 'examSim')}</Link>

        {/* Smart Review: title (+ due badge) on one line; when nothing is due, when the next one is */}
        {progress.wrongQuestions.length > 0 && (
          <Link
            href="/quiz?mode=review"
            className="flex w-full flex-col items-center gap-1 px-4 py-3.5 rounded-[10px] border border-stradeo-line bg-stradeo-bg2 text-stradeo-ink mb-2.5 hover:border-stradeo-ink"
          >
            <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
              <IconReview size={18} />
              {t(lang, 'smartReview')}
              {dueCount > 0 && <span className="font-mono text-[13px] px-1.5 py-0.5 rounded-md bg-stradeo-ink text-stradeo-bg">{dueCount} {t(lang, 'qDue')}</span>}
            </span>
            {dueCount === 0 && (
              <span className="text-[12px] text-stradeo-inkdim">
                {capitalize(t(lang, 'nothingDue'))}{nextReviewAt ? ` · ${t(lang, 'nextReview')} ${formatWhen(nextReviewAt, lang)}` : ''}
              </span>
            )}
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

function Greeting({ name, lastStudy, readiness, streak }: { name: string; lastStudy: string | null; readiness: number; streak: number }) {
  const { lang } = useLanguage()
  // Time-dependent: computed after mount so server and client markup match.
  const [line, setLine] = useState<{ key: UIKey; n?: number } | null>(null)
  useEffect(() => { setLine(greetingLine({ lastStudy, readiness, streak })) }, [lastStudy, readiness, streak])
  const days = daysSince(lastStudy)
  const when = days === null ? null : new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-days, 'day')
  return (
    <div className="mb-4 min-h-[64px]">
      <h1 className="text-[26px] leading-tight font-bold tracking-tight truncate">{name ? `${name}!` : 'Ciao!'}</h1>
      <p className={`text-[15px] text-stradeo-inkdim mt-0.5 transition-opacity duration-300 ${line ? 'opacity-100' : 'opacity-0'}`}>
        {line ? t(lang, line.key).replace('{n}', String(line.n ?? '')) : '\u00a0'}
        {when && <span className="text-stradeo-inkfaint"> · {t(lang, 'lastPractice')}: {when}</span>}
      </p>
    </div>
  )
}

const capitalize = (x: string) => x.charAt(0).toLocaleUpperCase() + x.slice(1)
