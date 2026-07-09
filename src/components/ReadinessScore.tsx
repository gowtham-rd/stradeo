'use client'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

interface Props {
  readiness: number
  totalCorrect: number
  totalWrong: number
  totalRemaining: number
}

export default function ReadinessScore({ readiness, totalCorrect, totalWrong, totalRemaining }: Props) {
  const { lang } = useLanguage()
  const hasStarted = totalCorrect + totalWrong > 0

  const gradientClass = readiness >= 80
    ? 'from-green-400 to-emerald-400'
    : readiness >= 50
    ? 'from-orange-400 to-orange-300'
    : 'from-red-400 to-red-300'

  const label = !hasStarted ? t(lang, 'startStudy')
    : readiness >= 90 ? t(lang, 'ready')
    : readiness >= 70 ? t(lang, 'close')
    : readiness >= 50 ? t(lang, 'good')
    : t(lang, 'keep')

  return (
    <div className="text-center py-6 px-5 mb-5 rounded-[20px] bg-gradient-to-br from-stradeo-bg2 to-orange-500/[0.06] border border-white/[0.06]">
      <div className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400 mb-2">{t(lang, 'readiness')}</div>
      <div className={`text-[56px] font-extrabold tracking-tight bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
        {readiness}%
      </div>
      <div className="text-[13px] text-gray-300 mt-1">{label}</div>
      <div className="flex justify-center gap-6 mt-4">
        <div><div className="text-xl font-bold text-stradeo-green">{totalCorrect}</div><div className="text-[11px] text-gray-400">{t(lang, 'correct')}</div></div>
        <div><div className="text-xl font-bold text-stradeo-accent2">{totalWrong}</div><div className="text-[11px] text-gray-400">{t(lang, 'wrong')}</div></div>
        <div><div className="text-xl font-bold text-stradeo-blue">{totalRemaining}</div><div className="text-[11px] text-gray-400">{t(lang, 'remaining')}</div></div>
      </div>
    </div>
  )
}
