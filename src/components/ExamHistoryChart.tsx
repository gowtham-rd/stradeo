'use client'
import type { ExamRecord } from '@/types'
import { MAX_ERRORS } from '@/lib/constants'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

// Bar chart of the latest exams: one square-topped bar per exam (score out of the
// total), green when passed and red when not, with the pass line drawn across.
// Bars are buttons when `onSelect` is given; `selected` highlights one exam.
export default function ExamHistoryChart({ exams, selected, onSelect, max = 10, height = 112 }: {
  exams: ExamRecord[]
  selected?: number
  onSelect?: (at: number) => void
  max?: number
  height?: number
}) {
  const { lang } = useLanguage()
  const shown = exams.slice(-max)
  const total = shown[0]?.total || 30
  const pass = total - MAX_ERRORS
  const passY = (1 - pass / total) * 100
  const dateFmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'numeric' })

  return (
    <div>
      <div className="relative" style={{ height }}>
        {/* Pass line */}
        <div className="absolute inset-x-0 border-t border-dashed border-stradeo-green/60" style={{ top: `${passY}%` }} aria-hidden="true">
          <span className="absolute right-0 -top-[15px] font-mono text-[10px] text-stradeo-green">{pass}</span>
        </div>
        <div className="absolute inset-0 flex items-end gap-1.5">
          {shown.map(e => {
            const ok = e.total - e.score <= MAX_ERRORS
            const dim = selected !== undefined && selected !== e.at
            const h = Math.max(4, (e.score / e.total) * 100)
            const Bar = onSelect ? 'button' : 'div'
            return (
              <Bar key={e.at} {...(onSelect ? { onClick: () => onSelect(e.at), type: 'button' as const } : {})}
                aria-label={`${dateFmt.format(e.at)}: ${e.score}/${e.total} · ${t(lang, ok ? 'pass' : 'fail')}`}
                aria-current={selected === e.at ? 'true' : undefined}
                className={`group relative flex-1 h-full flex flex-col justify-end items-center min-w-0 ${onSelect ? 'cursor-pointer active:scale-95' : ''}`}>
                <span className={`font-mono text-[10px] mb-0.5 transition-opacity ${dim ? 'opacity-40' : ''} ${ok ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>{e.score}</span>
                <span className={`w-full max-w-[28px] rounded-t-[4px] transition-[opacity,height] duration-500 ${ok ? 'bg-stradeo-green' : 'bg-stradeo-accent2'} ${dim ? 'opacity-30' : ''} ${selected === e.at ? 'ring-2 ring-stradeo-ink ring-offset-2 ring-offset-stradeo-bg2' : ''}`}
                  style={{ height: `calc(${h}% - 16px)` }} />
              </Bar>
            )
          })}
          {/* Empty slots keep bar widths steady while history is short */}
          {Array.from({ length: Math.max(0, Math.min(max, 6) - shown.length) }, (_, i) => (
            <div key={`e${i}`} className="flex-1 h-full flex items-end justify-center" aria-hidden="true">
              <span className="w-full max-w-[28px] h-1 rounded bg-stradeo-surface2" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 mt-1.5 border-t border-stradeo-line pt-1.5">
        {shown.map(e => (
          <div key={e.at} className={`flex-1 min-w-0 text-center font-mono text-[10px] truncate ${selected === e.at ? 'text-stradeo-ink font-bold' : 'text-stradeo-inkfaint'}`}>
            {dateFmt.format(e.at)}
          </div>
        ))}
        {Array.from({ length: Math.max(0, Math.min(max, 6) - shown.length) }, (_, i) => <div key={`e${i}`} className="flex-1" />)}
      </div>
    </div>
  )
}
