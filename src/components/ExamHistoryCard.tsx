'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { t } from '@/lib/i18n'
import { MAX_ERRORS } from '@/lib/constants'
import ExamHistoryChart from './ExamHistoryChart'
import { IconHistory, IconFinish, IconExam, IconArrowRight } from './icons'

// Home card: the latest exam simulations as a bar chart (tap a bar to open that
// exam's results), with exams taken, passed and best score.
export default function ExamHistoryCard() {
  const { lang } = useLanguage()
  const router = useRouter()
  const { progress } = useProgress()
  const exams = progress.exams || []
  const passedN = exams.filter(e => e.total - e.score <= MAX_ERRORS).length
  const best = exams.reduce((m, e) => Math.max(m, e.score), 0)
  const last = exams[exams.length - 1]

  return (
    <div className="rounded-[14px] bg-stradeo-bg2 border border-stradeo-line p-5 flex flex-col">
      <div className="flex items-center justify-center gap-2 mb-4">
        <IconHistory size={13} className="text-stradeo-blue" />
        <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim">{t(lang, 'examHistory')}</h2>
      </div>

      {exams.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-stradeo-surface2 text-stradeo-inkdim"><IconExam size={22} /></span>
          <p className="text-[13px] text-stradeo-inkdim max-w-[260px]">{t(lang, 'noExamsYet')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Figure value={exams.length} label={t(lang, 'examsTaken')} />
            <Figure value={passedN} label={t(lang, 'passRate')} tone={passedN > 0 ? 'text-stradeo-green' : undefined} icon={passedN > 0 ? <IconFinish size={13} /> : undefined} />
            <Figure value={`${best}/${last.total}`} label={t(lang, 'best')} />
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <ExamHistoryChart exams={exams} max={8} height={128} selected={last.at}
              onSelect={at => router.push(`/exam/review?at=${at}`)} />
          </div>
          <Link href={`/exam/review?at=${last.at}`}
            className="mt-3 inline-flex items-center justify-center gap-1.5 self-center text-[12px] font-semibold text-stradeo-inkdim hover:text-stradeo-ink">
            {t(lang, 'openResults')}<IconArrowRight size={11} />
          </Link>
        </>
      )}
    </div>
  )
}

function Figure({ value, label, tone, icon }: { value: React.ReactNode; label: string; tone?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[10px] border border-stradeo-line py-2.5">
      <span className={`inline-flex items-center gap-1 font-mono text-[18px] leading-none ${tone ?? 'text-stradeo-ink'}`}>{icon}{value}</span>
      <span className="mt-1 text-[11px] text-stradeo-inkdim">{label}</span>
    </div>
  )
}
