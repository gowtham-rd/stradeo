'use client'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { t } from '@/lib/i18n'
import { TOTAL_QUESTIONS } from '@/lib/questionCounts'
import { daysUntil, dailyGoal } from '@/lib/plan'
import { useToday } from '@/lib/useToday'
import { useCountUp } from '@/lib/useCountUp'
import { IconCalendar, IconCheck, IconArrowRight, IconFinish } from './icons'

// Slim strip under the greeting: exam countdown (or a prompt to set the date) and
// today's question goal with progress.
export default function TodayPlan() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const { progress, seenCount } = useProgress()
  // Date-dependent: after mount, and refreshed at midnight / when the app reopens.
  const today = useToday()
  const doneRaw = today ? (progress.dailyLog[today]?.total ?? 0) : 0
  const doneShown = Math.round(useCountUp(doneRaw, 700))
  if (!today) return <div className="h-[68px] mb-4" />

  const days = daysUntil(user?.examDate, new Date())
  const unseen = Math.max(0, TOTAL_QUESTIONS - seenCount())
  const goal = dailyGoal(unseen, days)
  const done = progress.dailyLog[today]?.total ?? 0
  const pct = Math.min(100, Math.round((done / goal) * 100))
  const reached = done >= goal

  return (
    <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-stretch rounded-[14px] border border-stradeo-line bg-stradeo-bg2 animate-rise">
      {/* Countdown */}
      {days === null ? (
        <Link href="/settings#exam-date" className="flex items-center gap-2.5 p-3 min-w-0 hover:bg-stradeo-surface2/50 rounded-l-[14px]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-stradeo-blue/10 text-stradeo-blue"><IconCalendar size={16} /></span>
          <span className="min-w-0 text-[13px] font-semibold leading-tight">{t(lang, 'setExamDate')}</span>
        </Link>
      ) : days < 0 ? (
        <Link href="/settings#exam-date" className="flex flex-col justify-center p-3 min-w-0 hover:bg-stradeo-surface2/50 rounded-l-[14px]">
          <span className="text-[12px] leading-tight text-stradeo-inkdim">{t(lang, 'examPassed')}</span>
          <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-stradeo-blue">{t(lang, 'updateDate')}<IconArrowRight size={11} /></span>
        </Link>
      ) : days === 0 ? (
        <div className="flex items-center gap-2.5 p-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-stradeo-green/10 text-stradeo-green"><IconFinish size={16} /></span>
          <span className="text-[13px] font-semibold leading-tight">{t(lang, 'examToday')}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-3 min-w-0">
          <span className={`font-mono text-[30px] leading-none tracking-tight ${days <= 7 ? 'text-stradeo-brandorange' : 'text-stradeo-ink'}`}>{days}</span>
          <span className="text-[12px] leading-tight text-stradeo-inkdim">{t(lang, days === 1 ? 'dayToExam' : 'daysToExam')}</span>
        </div>
      )}

      <span className="my-3 w-px bg-stradeo-line" aria-hidden="true" />

      {/* Today's goal */}
      <div className="flex flex-col justify-center p-3 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-stradeo-inkdim">{t(lang, 'todayLabel')}</span>
          {reached
            ? <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-stradeo-green"><IconCheck size={11} />{t(lang, 'goalDone')}</span>
            : <span className="font-mono text-[13px]"><span className="text-stradeo-ink">{doneShown}</span><span className="text-stradeo-inkfaint">/{goal}</span></span>}
        </div>
        <div className="mt-2 h-2 rounded-[4px] bg-stradeo-surface2 overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={done}
          aria-label={`${t(lang, 'todayLabel')}: ${done} ${t(lang, 'goalOf').replace('{n}', String(goal))}`}>
          <div className={`h-full rounded-[4px] transition-[width] duration-700 animate-grow-x origin-bar-x ${reached ? 'bg-stradeo-green' : 'bg-stradeo-ink'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
