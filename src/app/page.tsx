'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { TOPIC_COUNTS, TOTAL_QUESTIONS } from '@/lib/questionCounts'
import { studyTarget, daysUntil, localDay, dailyGoal } from '@/lib/plan'
import { MAX_ERRORS, NAME_MAX } from '@/lib/constants'
import { TOPICS, getTopicName } from '@/lib/topics'
import { t, type UIKey } from '@/lib/i18n'
import { daysSince, salutation, homeLine, reachedMilestones, type Line } from '@/lib/greeting'
import NavBar from '@/components/NavBar'
import ReadinessScore, { TopicMapCard } from '@/components/ReadinessScore'
import StatsPanel from '@/components/StatsPanel'
import TopicCard from '@/components/TopicCard'
import AdBanner from '@/components/AdBanner'
import SplashScreen from '@/components/SplashScreen'
import LoginForm from '@/components/LoginForm'
import { IconExam, IconReview, IconStudy, IconSun, IconSunrise, IconSunset, IconMoon } from '@/components/icons'
import { getLastTopic } from '@/lib/lastTopic'
import { nextBestTopic } from '@/lib/progress'
import HomeCards from '@/components/HomeCards'
import Onboarding from '@/components/Onboarding'
import TodayPlan from '@/components/TodayPlan'
import ExamHistoryCard from '@/components/ExamHistoryCard'
import ExamReady from '@/components/ExamReady'

// How long each home card stays before the next slides in.
const HOME_CARD_MS = 2500

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const { lang } = useLanguage()
  const { progress, loaded: progressLoaded, loadError, seenCount, getDueReviews, getTopicAccuracy, readiness, topicsCovered, streak } = useProgress()
  // Set when the calm placeholder was shown, so the real Home fades in once over it.
  const hadPlaceholder = useRef(false)
  // 'unknown' until we've checked this visit: the page's first paint is then a plain
  // background, so a reload never flashes the splash for a split second.
  const [splash, setSplash] = useState<'unknown' | 'show' | 'done'>('unknown')
  const [setupDone, setSetupDone] = useState(false)

  useEffect(() => {
    // Show the splash once per browser session, not every time Home opens.
    let seen = false
    try { seen = sessionStorage.getItem('stradeo-splash') === '1'; sessionStorage.setItem('stradeo-splash', '1') } catch { /* storage blocked */ }
    if (seen) { setSplash('done'); return }
    setSplash('show')
    const timer = setTimeout(() => setSplash('done'), 1800)
    return () => clearTimeout(timer)
  }, [])

  if (splash === 'unknown') return <div className="min-h-screen bg-stradeo-bg" />
  if (splash === 'show') return <SplashScreen />
  // Signing in from the saved session takes a moment: keep the plain background.
  if (authLoading) return <div className="min-h-screen bg-stradeo-bg" />
  if (!user) return <LoginForm />
  if (!user.onboarded && !setupDone) return <Onboarding onDone={() => setSetupDone(true)} />

  // No copy of this account's progress on the phone yet (first sign-in): a still
  // placeholder with the page's shape instead of empty numbers that then jump.
  if (!progressLoaded && !loadError) { hadPlaceholder.current = true; return <HomePlaceholder /> }

  const dueCount = getDueReviews().length
  const totalC = Object.values(progress.stats).reduce((a, s) => a + s.c, 0)
  const totalW = Object.values(progress.stats).reduce((a, s) => a + (s.t - s.c), 0)
  const totalRemaining = Math.max(0, TOTAL_QUESTIONS - seenCount())

  return (
    <div className="min-h-screen">
      <AdBanner />
      <NavBar />
      <div className={`max-w-[640px] mx-auto px-4 pt-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] ${hadPlaceholder.current ? 'animate-fade-in' : ''}`}>
        {/* Greeting: name, then a line for the time of day / how it's going */}
        <Greeting name={user.name || user.email?.split('@')[0] || ''} lastStudy={progress.lastStudy} readiness={readiness} streak={streak}
          dueCount={dueCount} examDate={user.examDate} totalDone={progress.totalDone}
          examPassed={(progress.exams || []).some(e => e.total - e.score <= MAX_ERRORS)} loaded={progressLoaded}
          unseen={totalRemaining} dailyLog={progress.dailyLog} />

        {/* Exam countdown + today's goal */}
        <TodayPlan />

        {/* Readiness → Topic map → Stats → Exam history: auto-advances, swipe or tap the dots */}
        <HomeCards className="mb-4" autoPlay={HOME_CARD_MS} cards={[
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
          { label: t(lang, 'examHistory'), content: <ExamHistoryCard /> },
        ]} />

        {/* Am I ready? Last five practice exams */}
        <ExamReady />

        {/* Exam Button */}
        <Link
          href="/exam"
          className="flex w-full min-h-[56px] items-center justify-center gap-2 px-4 py-2 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-[15px] font-bold mb-2.5"
        ><IconExam size={18} />{t(lang, 'examSim')}</Link>

        {/* Continue / start studying: the topic opened last (or the one worth most) */}
        <StudyButton />

        {/* Smart Review: only when missed questions are due again */}
        {dueCount > 0 && (
          <Link
            href="/quiz?mode=review"
            className="flex w-full items-center gap-3 px-4 py-3 rounded-[10px] border border-stradeo-line bg-stradeo-bg2 text-stradeo-ink mb-2.5 hover:border-stradeo-ink animate-rise"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-stradeo-blue/10 text-stradeo-blue"><IconReview size={17} /></span>
            <span className="flex-1 text-[15px] font-semibold">{t(lang, 'smartReview')}</span>
            <span className="font-mono text-[13px] px-1.5 py-0.5 rounded-md bg-stradeo-ink text-stradeo-bg">{dueCount} {t(lang, 'qDue')}</span>
          </Link>
        )}

        {/* Topics */}
        <div className="text-[13px] font-semibold text-stradeo-inkdim uppercase tracking-[1.5px] mb-3 mt-5">
          {t(lang, 'topicsTitle')}
        </div>
        <div className="stagger">
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
    </div>
  )
}

function Greeting({ name, lastStudy, readiness, streak, dueCount, examDate, totalDone, examPassed, loaded, unseen, dailyLog }: {
  loaded: boolean; name: string; lastStudy: string | null; readiness: number; streak: number
  dueCount: number; examDate: string | null | undefined; totalDone: number; examPassed: boolean
  unseen: number; dailyLog: Record<string, { total: number }>
}) {
  const { lang } = useLanguage()
  // Time- and device-dependent: computed after mount so server and client markup match.
  const [g, setG] = useState<{ hello: UIKey; line: Line } | null>(null)
  useEffect(() => {
    if (!loaded) return // milestones need the saved progress, not the empty start
    const now = new Date()
    const today = localDay()
    const examDaysLeft = daysUntil(examDate, now)
    // A milestone shows on the day it is first reached, then never again (per device).
    let shown: Record<string, string> = {}
    try { shown = JSON.parse(localStorage.getItem(MILESTONES_KEY) || '{}') } catch { /* storage blocked */ }
    const reached = reachedMilestones({ totalDone, readiness, examPassed })
    // First time on this device: milestones already reached are recorded silently,
    // so nobody gets an old "100 questions" note after thousands.
    const firstVisit = !Object.keys(shown).length
    // The newest one only (500 beats 100); older unseen ones are recorded silently.
    const milestone = firstVisit ? null : [...reached].reverse().find(m => !shown[m.id] || shown[m.id] === today) ?? null
    const next = { ...shown }
    for (const m of reached) if (!next[m.id]) next[m.id] = m === milestone ? today : '0'
    if (firstVisit) next._init = today
    try { localStorage.setItem(MILESTONES_KEY, JSON.stringify(next)) } catch { /* storage blocked */ }
    setG({
      hello: salutation(now.getHours()),
      line: homeLine({ lastStudy, readiness: Math.round(readiness), streak, dueCount, examDaysLeft, milestone, now,
        goal: dailyGoal(unseen, examDaysLeft), doneToday: dailyLog[today]?.total ?? 0, unseen }),
    })
  }, [loaded, lastStudy, readiness, streak, dueCount, examDate, totalDone, examPassed, unseen, dailyLog])
  const wrapRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  // Greeting on one line, and the time-of-day icon centred in the space it leaves on
  // the right: as wide as that space, up to the height of both lines (64px), at least 32px.
  // The heading's font shrinks (26 → 18px) only when the text wouldn't fit beside the
  // smallest icon; the line below wraps before it runs under the icon. Sizes are set
  // on the elements directly; measured again when the web font loads or the width changes.
  useLayoutEffect(() => {
    const el = textRef.current, wrap = wrapRef.current
    const h1 = el?.parentElement, line = wrap?.querySelector('p') as HTMLElement | null
    if (!el || !wrap || !h1 || !line) return
    const GAP = 12, MIN = 32, MAX = 64
    let lastW = -1
    const fit = () => {
      const W = wrap.clientWidth
      const cur = parseFloat(h1.style.fontSize) || 26
      el.style.maxWidth = 'none'
      const perPx = (el.scrollWidth + 1) / cur
      el.style.maxWidth = ''
      let f = Math.max(18, Math.min(26, Math.floor(((W - GAP - MIN) / perPx) * 2) / 2))
      if (!(f < cur || f - cur >= 1)) f = cur // grow only by a whole pixel (no rounding back-and-forth)
      h1.style.fontSize = f + 'px'
      const icon = Math.round(Math.max(MIN, Math.min(MAX, W - perPx * f - GAP)))
      // The icon sits in the middle of the space between the greeting and the edge;
      // the line below stops a gap before the icon's left side.
      const space = Math.max(icon, Math.floor(W - perPx * f - GAP))
      wrap.style.setProperty('--hello-icon', icon + 'px')
      wrap.style.setProperty('--hello-space', space + 'px')
      line.style.maxWidth = Math.floor(W - (space + icon) / 2 - GAP) + 'px'
    }
    fit()
    const family = getComputedStyle(h1).fontFamily
    document.fonts?.load(`700 26px ${family}`).then(fit, () => {})
    document.fonts?.addEventListener?.('loadingdone', fit)
    const ro = new ResizeObserver(entries => {
      for (const e of entries) if (e.target === el || e.contentRect.width !== lastW) { if (e.target === wrap) lastW = e.contentRect.width; fit(); return }
    })
    ro.observe(wrap); ro.observe(el)
    return () => { document.fonts?.removeEventListener?.('loadingdone', fit); ro.disconnect() }
  }, [g, name, lang])
  const days = daysSince(lastStudy)
  // "Last practice" only when it is a useful nudge (2+ days ago).
  const when = days === null || days < 2 ? null : new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-days, 'day')
  const first = name.slice(0, NAME_MAX).replace(/[\s!.?,]+$/, '')
  return (
    <div ref={wrapRef} className="relative mb-4 min-h-[64px]">
      <h1 style={{ fontSize: 26 }} className={`whitespace-nowrap leading-tight font-bold tracking-tight transition-opacity duration-300 ${g ? 'opacity-100 animate-fade-in' : 'opacity-0'}`}>
        <span ref={textRef} className="inline-block max-w-full align-bottom truncate">{g ? (first ? `${t(lang, g.hello)}, ${first}!` : `${t(lang, g.hello)}!`) : '\u00a0'}</span>
      </h1>
      <p className={`text-[15px] leading-snug text-stradeo-inkdim mt-1 ${g ? 'animate-fade-in [animation-delay:120ms]' : 'opacity-0'}`}>
        {g ? fill(t(lang, g.line.key), g.line, lang) : '\u00a0'}
        {g && when && <span className="text-stradeo-inkfaint"> · {t(lang, 'lastPractice')}: {when}</span>}
      </p>
      {g && <HelloIcon k={g.hello} />}
    </div>
  )
}

const MILESTONES_KEY = 'stradeo-milestones'
const HELLO_ICONS: Record<string, typeof IconSun> = { helloMorning: IconSunrise, helloAfternoon: IconSun, helloEvening: IconSunset, helloNight: IconMoon }
function HelloIcon({ k }: { k: string }) {
  const I = HELLO_ICONS[k] ?? IconSun
  return (
    <span className="absolute inset-y-0 right-0 w-[var(--hello-space,40px)] flex items-center justify-center pointer-events-none">
      <I className="w-[var(--hello-icon,40px)] h-[var(--hello-icon,40px)] text-stradeo-brandorange animate-fade-in" />
    </span>
  )
}
// Puts the line's numbers in, formatted for the language (7,106 / 7.106).
const fill = (text: string, l: Line, lang: string) => {
  const f = (v?: number) => (v === undefined ? '' : new Intl.NumberFormat(lang).format(v))
  return text.replace('{n}', f(l.n)).replace('{m}', f(l.m))
}

function StudyButton() {
  const { lang } = useLanguage()
  const { progress, getTopicAccuracy, seenCount } = useProgress()
  // Read after mount (device storage), so server and client markup match.
  const [last, setLast] = useState<number | null | undefined>(undefined)
  useEffect(() => { setLast(getLastTopic()) }, [])
  const started = progress.totalDone > 0 || !!last
  // First pass in order 1 → 25 (moving on once a topic is done), then biggest gain.
  const topic = studyTarget({
    last: last ?? null,
    seen: t => seenCount(t),
    count: t => TOPIC_COUNTS[t] || 0,
    accuracy: t => getTopicAccuracy(t),
    bestGain: nextBestTopic(progress.stats),
  })
  const acc = getTopicAccuracy(topic)
  return (
    <Link href={`/topic?id=${topic}`}
      className={`flex w-full min-h-[56px] flex-col items-center justify-center px-4 py-2 rounded-[10px] bg-stradeo-green text-stradeo-bg mb-2.5 transition-opacity duration-300 ${last === undefined ? 'opacity-0' : 'opacity-100'}`}>
      <span className="inline-flex items-center gap-2 text-[15px] font-bold"><IconStudy size={18} />{t(lang, started ? 'continueStudying' : 'startStudying')}</span>
      <span className="max-w-full truncate text-[12px] opacity-80 mt-0.5">
        <span className="font-mono">{String(topic).padStart(2, '0')}</span> · {getTopicName(topic, lang)}{acc !== null ? ` · ${acc}%` : ''}
      </span>
    </Link>
  )
}

function HomePlaceholder() {
  const block = 'rounded-[14px] border border-stradeo-line bg-stradeo-bg2'
  return (
    <div className="min-h-screen" aria-busy="true">
      <NavBar />
      <div className="max-w-[640px] mx-auto px-4 pt-4">
        <div className="mb-4 h-[64px]">
          <div className="h-7 w-2/3 rounded-md bg-stradeo-surface2" />
          <div className="mt-2.5 h-4 w-1/2 rounded bg-stradeo-surface2" />
        </div>
        <div className={`${block} h-[76px] mb-4`} />
        <div className={`${block} h-[330px] mb-4`} />
        <div className={`${block} h-[58px]`} />
      </div>
    </div>
  )
}
