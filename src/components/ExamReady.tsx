'use client'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { t } from '@/lib/i18n'
import { MAX_ERRORS } from '@/lib/constants'
import { IconFinish, IconChevronRight } from './icons'
import { useState } from 'react'
import { firstTimeThisVisit } from '@/lib/useCountUp'

export const READY_WINDOW = 5
export const READY_NEED = 4

/** Exam readiness from practice exams: passes among the last five. */
export function examReadiness(exams: { score: number; total: number }[]) {
  const last = exams.slice(-READY_WINDOW).map(e => e.total - e.score <= MAX_ERRORS)
  const passed = last.filter(Boolean).length
  const ready = last.length === READY_WINDOW && passed >= READY_NEED
  return { last, passed, ready }
}

// Home: "Am I ready?" — one square per recent practice exam (green pass, red fail,
// empty not taken yet), newest on the right, and what's still needed.
export default function ExamReady() {
  const { lang } = useLanguage()
  const { progress, loaded } = useProgress()
  // The squares pop in once per visit, not on every reload.
  const [intro] = useState(() => typeof window !== 'undefined' && firstTimeThisVisit('ready-strip'))
  const { last, passed, ready } = examReadiness(progress.exams || [])
  const slots = Array.from({ length: READY_WINDOW }, (_, i) => last[i - (READY_WINDOW - last.length)])
  const more = READY_WINDOW - last.length

  const line = last.length === 0 ? t(lang, 'readyNone')
    : ready ? t(lang, 'readyYes').replace('{p}', String(passed))
    : more > 0 ? t(lang, 'readyMore').replace('{p}', String(passed)).replace('{n}', String(last.length)).replace('{m}', String(more))
    : t(lang, 'readyNotYet').replace('{p}', String(passed))

  return (
    <Link href="/exam" className={`mb-2 flex items-center gap-3 rounded-[10px] border px-3.5 py-2.5 transition-colors ${ready ? 'border-stradeo-green/40 bg-stradeo-green/[0.06]' : 'border-stradeo-line bg-stradeo-bg2 hover:border-stradeo-ink'} ${loaded ? '' : 'opacity-0'}`}>
      <span className="flex gap-1" role="img" aria-label={`${passed}/${last.length}`}>
        {slots.map((s, i) => (
          <span key={i} style={{ animationDelay: `${120 + i * 70}ms` }}
            className={`h-5 w-3.5 rounded-[3px] ${loaded && intro ? 'animate-pop' : ''} ${s === undefined ? 'border border-dashed border-stradeo-line' : s ? 'bg-stradeo-green' : 'bg-stradeo-accent2'}`} />
        ))}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className={`flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[1px] ${ready ? 'text-stradeo-green' : 'text-stradeo-inkdim'}`}>
          {ready && <IconFinish size={12} />}{t(lang, ready ? 'examReadyTitle' : 'examReadyQ')}
        </span>
        <span className="block text-[13px] text-stradeo-ink mt-0.5">{line}</span>
      </span>
      <IconChevronRight size={14} className="shrink-0 text-stradeo-inkfaint" />
    </Link>
  )
}
