'use client'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { t } from '@/lib/i18n'
import { getTopicName } from '@/lib/topics'
import { topicScore, nextBestTopic } from '@/lib/progress'
import TopicCard from './TopicCard'
import HomeCards from './HomeCards'
import { TOPICS } from '@/lib/topics'
import { TOPIC_COUNTS } from '@/lib/questionCounts'
import { useCountUp } from '@/lib/useCountUp'

// Square colour for one topic: untouched, weak, getting there, ready (≥90% ≈ pass mark).
function cellClass(score: number, answered: number): string {
  if (answered === 0) return 'bg-stradeo-surface2'
  if (score >= 0.9) return 'bg-stradeo-green'
  if (score >= 0.5) return 'bg-stradeo-accent'
  return 'bg-stradeo-accent2'
}

interface Props {
  readiness: number
  totalCorrect: number
  totalWrong: number
  totalRemaining: number
  topicsCovered: number
}

export default function ReadinessScore({ readiness, totalCorrect, totalWrong, totalRemaining, topicsCovered }: Props) {
  const { lang } = useLanguage()
  const { progress, getTopicAccuracy, seenCount } = useProgress()
  const next = nextBestTopic(progress.stats)
  // Topic tapped on the map: shown as a card beside "Biggest gain next".
  const [picked, setPicked] = useState<number | null>(null)
  const [jump, setJump] = useState<{ index: number; seq: number } | undefined>()
  const pick = (id: number) => {
    setPicked(id)
    setJump(j => ({ index: next ? 1 : 0, seq: (j?.seq ?? 0) + 1 }))
  }
  const topicSlide = (id: number, label: string) => {
    const meta = TOPICS.find(x => x.id === id)!
    return {
      label,
      content: (
        <div className="text-left px-px">
          <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-stradeo-inkdim mb-1.5 pl-0.5">{label}</div>
          <TopicCard topic={meta} count={TOPIC_COUNTS[id] || 0} accuracy={getTopicAccuracy(id)} done={seenCount(id)} />
        </div>
      ),
    }
  }
  const slides = [
    ...(next ? [topicSlide(next, t(lang, 'nextUp'))] : []),
    ...(picked ? [topicSlide(picked, t(lang, 'selectedTopic'))] : []),
  ]
  const hasStarted = totalCorrect + totalWrong > 0

  // Count up from 0; number and meter take the colour of the band the *animated* value is in,
  // so they pass red → orange → green as they rise.
  const shown = useCountUp(readiness)
  const band = shown >= 90 ? 'green' : shown >= 50 ? 'accent' : 'accent2'
  const scoreClass = !hasStarted ? 'text-stradeo-inkfaint'
    : { green: 'text-stradeo-green', accent: 'text-stradeo-accent', accent2: 'text-stradeo-accent2' }[band]
  const fillClass = { green: 'bg-stradeo-green', accent: 'bg-stradeo-accent', accent2: 'bg-stradeo-accent2' }[band]

  const label = !hasStarted ? t(lang, 'startStudy')
    : readiness >= 90 ? t(lang, 'ready')
    : readiness >= 70 ? t(lang, 'close')
    : readiness >= 50 ? t(lang, 'good')
    : t(lang, 'keep')

  return (
    <div className="h-full flex flex-col text-center py-6 px-5 rounded-[14px] bg-stradeo-bg2 border border-stradeo-line">
      <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim mb-2">{t(lang, 'readiness')}</div>
      <div className={`font-mono text-[52px] leading-tight tracking-tight tabular-nums transition-colors duration-300 ${scoreClass}`}
        aria-live="off" aria-label={`${readiness}%`}>
        {Math.round(shown)}%
      </div>

      {/* Readiness meter: solid band colour, square ends, notch at the 90% pass line. */}
      <div className="mx-auto mt-3 w-full max-w-[300px]" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness}
        aria-label={t(lang, 'readiness')}>
        <div className="relative h-2 rounded-[3px] bg-stradeo-surface2 overflow-hidden">
          <div className={`absolute inset-y-0 left-0 rounded-[3px] transition-colors duration-300 ${hasStarted ? fillClass : ''}`}
            style={{ width: `${shown}%` }} />
          <div className="absolute inset-y-0 left-1/2 w-px bg-stradeo-bg2" aria-hidden="true" />
          <div className="absolute inset-y-0 left-[90%] w-[2px] bg-stradeo-ink" aria-hidden="true" />
        </div>
        <div className="relative h-4 mt-1 font-mono text-[10px] text-stradeo-inkfaint" aria-hidden="true">
          <span className="absolute left-0">0</span>
          <span className="absolute left-1/2 -translate-x-1/2">50</span>
          <span className="absolute left-[90%] -translate-x-[60%] text-stradeo-ink whitespace-nowrap">90 · {t(lang, 'passMark')}</span>
        </div>
      </div>
      <div className="text-[13px] text-stradeo-inkdim mt-1">{label}</div>
      <div className="font-mono text-[12px] text-stradeo-inkdim mt-2">{topicsCovered}/25 {t(lang, 'topicsCovered')}</div>
      <div className="flex justify-center gap-6 mt-4">
        <div><div className="font-mono text-xl text-stradeo-green">{totalCorrect}</div><div className="text-[11px] text-stradeo-inkdim">{t(lang, 'correct')}</div></div>
        <div><div className="font-mono text-xl text-stradeo-accent2">{totalWrong}</div><div className="text-[11px] text-stradeo-inkdim">{t(lang, 'wrong')}</div></div>
        <div><div className="font-mono text-xl text-stradeo-ink">{totalRemaining}</div><div className="text-[11px] text-stradeo-inkdim">{t(lang, 'remaining')}</div></div>
      </div>

      {/* Topic map: one square per topic, coloured by its readiness. Tap to open. */}
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim mb-2">{t(lang, 'topicMap')}</div>
        {/* Row 1: topics 1–15 (2 exam questions each). Row 2: topics 16–25 (1 each), centred. */}
        <div className="max-w-[360px] mx-auto space-y-[4px]">
          {[[1, 15], [16, 25]].map(([from, to]) => (
            <div key={from} className="flex justify-center gap-[4px]">
              {Array.from({ length: to - from + 1 }, (_, i) => from + i).map(id => {
                const answered = progress.stats[id]?.t ?? 0
                const sc = topicScore(progress.stats, id)
                return (
                  <button key={id} type="button" onClick={() => pick(id)} aria-pressed={picked === id}
                    title={`${String(id).padStart(2, '0')} · ${getTopicName(id, lang)} · ${Math.round(sc * 100)}%`}
                    aria-label={`${getTopicName(id, lang)}: ${Math.round(sc * 100)}%`}
                    className={`w-[calc((100%-56px)/15)] aspect-square rounded-[3px] ${cellClass(sc, answered)} ${picked === id ? 'outline outline-2 outline-offset-1 outline-stradeo-ink' : 'hover:outline hover:outline-2 hover:outline-stradeo-ink'}`} />
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-3 mt-2 text-[10px] text-stradeo-inkdim">
          <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-[2px] bg-stradeo-accent2" />&lt;50%</span>
          <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-[2px] bg-stradeo-accent" />50–89%</span>
          <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-[2px] bg-stradeo-green" />90%+</span>
          <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-[2px] bg-stradeo-surface2 border border-stradeo-line" />{t(lang, 'notStarted')}</span>
        </div>
      </div>

      {/* Biggest gain next + tapped topic, as swipeable cards */}
      {slides.length > 0 && (
        <HomeCards key={slides.map(x => x.label).join('|')} cards={slides} goTo={jump} className="mt-4" />
      )}
      {!picked && <p className="text-[11px] text-stradeo-inkfaint mt-2">{t(lang, 'tapSquare')}</p>}

      <p className="text-[11px] leading-snug text-stradeo-inkfaint mt-auto pt-4 max-w-[360px] mx-auto">{t(lang, 'readinessHint')}</p>
    </div>
  )
}
