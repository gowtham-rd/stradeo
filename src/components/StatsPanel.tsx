'use client'
import { useMemo } from 'react'
import { useToday } from '@/lib/useToday'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { t } from '@/lib/i18n'
import { IconStreak, IconCalendar, IconAccuracy } from '@/components/icons'

export default function StatsPanel() {
  const { lang } = useLanguage()
  const { progress, streak } = useProgress()
  const todayKey = useToday() // re-computes the 7-day window when the date changes

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
  }, [progress.dailyLog, lang, todayKey])

  const maxTotal = Math.max(...dayData.map(d => d.total), 1)
  const todayStr = new Date().toLocaleDateString('sv')

  return (
    <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-4 flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim mb-3 text-center">{t(lang, 'stats')}</div>
      {/* Three headline figures, icon on top */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat tone="text-stradeo-blue bg-stradeo-blue/10" icon={<IconCalendar size={18} />} value={<span className="text-stradeo-ink">{weekTotal}</span>} label={t(lang, 'thisWeek')} />
        <Stat tone={weekTotal === 0 ? 'text-stradeo-inkdim bg-stradeo-surface2' : weekAcc >= 90 ? 'text-stradeo-green bg-stradeo-green/10' : weekAcc >= 50 ? 'text-stradeo-accent bg-stradeo-accent/10' : 'text-stradeo-accent2 bg-stradeo-accent2/10'}
          icon={<IconAccuracy size={18} />} value={<span className={weekTotal === 0 ? 'text-stradeo-inkdim' : weekAcc >= 90 ? 'text-stradeo-green' : weekAcc >= 50 ? 'text-stradeo-accent' : 'text-stradeo-accent2'}>{weekAcc}%</span>} label={t(lang, 'accuracy')} />
        <Stat tone="text-stradeo-brandorange bg-stradeo-brandorange/10" icon={<IconStreak size={18} />} value={<span className="text-stradeo-ink">{streak}</span>} label={t(lang, 'streak')} />
      </div>

      {/* Last 7 days: the chart takes whatever height the card has left */}
      <div className="flex-1 flex flex-col min-h-[96px]">
        <div className="text-[11px] font-bold text-stradeo-inkdim uppercase tracking-[2px] mb-2">{t(lang, 'last7')}</div>
        <div className="flex-1 flex items-stretch gap-1.5 mb-1">
          {dayData.map((d, i) => {
            const pct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0
            const acc = d.total > 0 ? d.c / d.total : 0
            return (
              <div key={i} className="flex-1 relative">
                {/* Bar: green = correct (bottom), red = wrong (top); the top 14px stays free for the count */}
                <div className="absolute inset-x-0 bottom-0 top-[14px]">
                  <div className="absolute inset-x-0 bottom-0 flex flex-col-reverse rounded-[4px] overflow-hidden bg-stradeo-accent2/25 animate-grow-y origin-bar-y transition-[height] duration-500"
                    style={{ height: d.total ? `${Math.max(pct, 3)}%` : 2 }}>
                    <div className="w-full bg-stradeo-green transition-[height] duration-500" style={{ height: `${acc * 100}%` }} />
                  </div>
                  {d.total > 0 && (
                    <span className="absolute inset-x-0 text-center text-[10px] text-stradeo-inkdim font-semibold leading-none"
                      style={{ bottom: `calc(${Math.max(pct, 3)}% + 3px)` }}>{d.total}</span>
                  )}
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
    <div className="flex flex-col items-center rounded-[10px] border border-stradeo-line px-1.5 py-2.5 min-w-0">
      <span className={`flex h-9 w-9 items-center justify-center rounded-[9px] ${tone}`} aria-hidden="true">{icon}</span>
      <span className="font-mono text-[20px] leading-none mt-2">{value}</span>
      <span className="text-[11px] text-stradeo-inkdim leading-none text-center mt-1.5">{label}</span>
    </div>
  )
}
