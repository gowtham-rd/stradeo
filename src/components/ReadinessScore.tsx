'use client'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

interface Props {
  readiness: number
  totalCorrect: number
  totalWrong: number
  totalRemaining: number
  topicsCovered: number
}

export default function ReadinessScore({ readiness, totalCorrect, totalWrong, totalRemaining, topicsCovered }: Props) {
  const { lang } = useLanguage()
  const hasStarted = totalCorrect + totalWrong > 0

  const scoreClass = !hasStarted ? 'text-stradeo-inkfaint'
    : readiness >= 90 ? 'text-stradeo-green'
    : readiness >= 50 ? 'text-stradeo-accent'
    : 'text-stradeo-accent2'

  const label = !hasStarted ? t(lang, 'startStudy')
    : readiness >= 90 ? t(lang, 'ready')
    : readiness >= 70 ? t(lang, 'close')
    : readiness >= 50 ? t(lang, 'good')
    : t(lang, 'keep')

  return (
    <div className="h-full text-center py-6 px-5 rounded-[14px] bg-stradeo-bg2 border border-stradeo-line">
      <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim mb-2">{t(lang, 'readiness')}</div>
      <div className={`font-mono text-[52px] leading-tight tracking-tight ${scoreClass}`}>
        {readiness}%
      </div>
      <div className="text-[13px] text-stradeo-inkdim mt-1">{label}</div>
      <div className="font-mono text-[12px] text-stradeo-inkdim mt-2">{topicsCovered}/25 {t(lang, 'topicsCovered')}</div>
      <div className="flex justify-center gap-6 mt-4">
        <div><div className="font-mono text-xl text-stradeo-green">{totalCorrect}</div><div className="text-[11px] text-stradeo-inkdim">{t(lang, 'correct')}</div></div>
        <div><div className="font-mono text-xl text-stradeo-accent2">{totalWrong}</div><div className="text-[11px] text-stradeo-inkdim">{t(lang, 'wrong')}</div></div>
        <div><div className="font-mono text-xl text-stradeo-ink">{totalRemaining}</div><div className="text-[11px] text-stradeo-inkdim">{t(lang, 'remaining')}</div></div>
      </div>
      <p className="text-[11px] leading-snug text-stradeo-inkfaint mt-4 max-w-[360px] mx-auto">{t(lang, 'readinessHint')}</p>
    </div>
  )
}
