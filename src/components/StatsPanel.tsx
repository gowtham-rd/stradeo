'use client'
import { useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { t } from '@/lib/i18n'
import { IconStreak, IconCalendar, IconAccuracy } from '@/components/icons'

export default function StatsPanel() {
  const { lang } = useLanguage()
  const { progress, streak } = useProgress()

  const { days, dayData, dayLabels, weekTotal, weekAcc } = useMemo(() => {
    const d: string[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(today)
      dt.setDate(dt.getDate() - i)
      d.push(dt.toLocaleDateString('sv'))
    }
    const dd = d.map(day => progress.dailyLog[day] || { c: 0, w: 0, total: 0 })
    const wt = dd.reduce((a, x) => a + x.total, 0)
    const wc = dd.reduce((a, x) => a + x.c, 0)
    const labels = d.map(day => {
      const dt = new Date(day + 'T12:00:00')
      return dt.toLocaleDateString(lang, { weekday: 'short' })
    })
    return { days: d, dayData: dd, dayLabels: labels, weekTotal: wt, weekAcc: wt > 0 ? Math.round(wc / wt * 100) : 0 }
  }, [progress.dailyLog, lang])

  const maxTotal = Math.max(...dayData.map(d => d.total), 1)
  const todayStr = new Date().toLocaleDateString('sv')

  return (
    <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-4 flex flex-col justify-between">
      <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim mb-3 text-center">{t(lang, 'stats')}</div>
      {/* Three headline figures, each with its icon tile */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat tone="text-stradeo-blue bg-stradeo-blue/10" icon={<IconCalendar size={15} />} value={<span className="text-stradeo-ink">{weekTotal}</span>} label={t(lang, 'thisWeek')} />
        <Stat tone={weekTotal === 0 ? 'text-stradeo-inkdim bg-stradeo-surface2' : weekAcc >= 90 ? 'text-stradeo-green bg-stradeo-green/10' : weekAcc >= 50 ? 'text-stradeo-accent bg-stradeo-accent/10' : 'text-stradeo-accent2 bg-stradeo-accent2/10'}
          icon={<IconAccuracy size={15} />} value={<span className={weekTotal === 0 ? 'text-stradeo-inkdim' : weekAcc >= 90 ? 'text-stradeo-green' : weekAcc >= 50 ? 'text-stradeo-accent' : 'text-stradeo-accent2'}>{weekAcc}%</span>} label={t(lang, 'accuracy')} />
        <Stat tone="text-stradeo-brandorange bg-stradeo-brandorange/10" icon={<IconStreak size={15} />} value={<span className="text-stradeo-ink">{streak}</span>} label={t(lang, 'streak')} />
      </div>

      <div>
      <div className="text-[11px] font-bold text-stradeo-inkdim uppercase tracking-[2px] mb-2">{t(lang, 'last7')}</div>
      <div className="flex items-end gap-1.5 h-16 mb-1">
        {dayData.map((d, i) => {
          const h = maxTotal > 0 ? (d.total / maxTotal) * 46 : 0
          const acc = d.total > 0 ? d.c / d.total : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-stradeo-inkdim font-semibold">{d.total || ''}</span>
              <div className="w-full rounded bg-stradeo-accent2/20 transition-all duration-500" style={{ height: Math.max(h, 2) }}>
                <div className="w-full rounded bg-stradeo-green transition-all duration-500" style={{ height: `${acc * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5">
        {dayLabels.map((l, i) => (
          <div key={i} className={`flex-1 text-center text-[10px] font-semibold ${days[i] === todayStr ? 'text-stradeo-ink font-bold' : 'text-stradeo-inkdim'}`}>{l}</div>
        ))}
      </div>
      </div>
    </div>
  )
}

function Stat({ icon, value, label, tone }: { icon: React.ReactNode; value: React.ReactNode; label: string; tone: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-stradeo-line px-2 py-2 min-w-0">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${tone}`} aria-hidden="true">{icon}</span>
      <span className="flex flex-col min-w-0">
        <span className="font-mono text-[17px] leading-none">{value}</span>
        <span className="mt-1 text-[10px] text-stradeo-inkdim leading-none truncate">{label}</span>
      </span>
    </div>
  )
}
