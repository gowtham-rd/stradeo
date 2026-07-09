'use client'
import { useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { TOPICS, getTopicName } from '@/lib/topics'
import { t } from '@/lib/i18n'
import Link from 'next/link'

export default function StatsPanel() {
  const { lang } = useLanguage()
  const { progress, getTopicAccuracy } = useProgress()

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
      return dt.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' }).substring(0, 2)
    })
    return { days: d, dayData: dd, dayLabels: labels, weekTotal: wt, weekAcc: wt > 0 ? Math.round(wc / wt * 100) : 0 }
  }, [progress.dailyLog, lang])

  const maxTotal = Math.max(...dayData.map(d => d.total), 1)
  const todayStr = new Date().toLocaleDateString('sv')

  const weakestTopics = useMemo(() => {
    return TOPICS
      .map(topic => ({ ...topic, pct: getTopicAccuracy(topic.id), done: progress.stats[topic.id]?.t || 0 }))
      .filter(t => t.pct !== null)
      .sort((a, b) => (a.pct || 0) - (b.pct || 0))
      .slice(0, 3)
  }, [progress.stats, getTopicAccuracy])

  return (
    <div className="bg-stradeo-bg2 border border-white/10 rounded-[18px] p-5 mb-5 animate-fade-in">
      <div className="flex justify-around mb-5">
        <div className="text-center"><div className="text-[22px] font-bold text-stradeo-accent">{weekTotal}</div><div className="text-[11px] text-gray-400">This week</div></div>
        <div className="text-center"><div className={`text-[22px] font-bold ${weekAcc >= 80 ? 'text-stradeo-green' : weekAcc >= 50 ? 'text-stradeo-accent' : 'text-stradeo-accent2'}`}>{weekAcc}%</div><div className="text-[11px] text-gray-400">Accuracy</div></div>
        <div className="text-center"><div className="text-[22px] font-bold text-stradeo-accent">🔥 {progress.streak}</div><div className="text-[11px] text-gray-400">Streak</div></div>
      </div>

      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Last 7 days</div>
      <div className="flex items-end gap-1.5 h-20 mb-1">
        {dayData.map((d, i) => {
          const h = maxTotal > 0 ? (d.total / maxTotal) * 60 : 0
          const acc = d.total > 0 ? d.c / d.total : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-gray-400 font-semibold">{d.total || ''}</span>
              <div className="w-full rounded bg-red-500/20 transition-all duration-500" style={{ height: Math.max(h, 2) }}>
                <div className="w-full rounded bg-gradient-to-b from-stradeo-green to-green-500/60 transition-all duration-500" style={{ height: `${acc * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5">
        {dayLabels.map((l, i) => (
          <div key={i} className={`flex-1 text-center text-[10px] font-semibold ${days[i] === todayStr ? 'text-stradeo-accent' : 'text-gray-400'}`}>{l}</div>
        ))}
      </div>

      {weakestTopics.length > 0 && (
        <>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-5 mb-2.5">Weakest topics</div>
          {weakestTopics.map(wt => (
            <div key={wt.id} className="flex items-center gap-2.5 mb-1.5">
              <span className={`text-xs font-bold min-w-[32px] ${(wt.pct || 0) >= 80 ? 'text-stradeo-green' : (wt.pct || 0) >= 50 ? 'text-stradeo-accent' : 'text-stradeo-accent2'}`}>{wt.pct}%</span>
              <div className="flex-1">
                <div className="text-[13px]">{getTopicName(wt.id, lang)}</div>
                <div className="h-[3px] rounded bg-white/[0.06] mt-1">
                  <div className={`h-full rounded ${(wt.pct || 0) >= 80 ? 'bg-stradeo-green' : (wt.pct || 0) >= 50 ? 'bg-stradeo-accent' : 'bg-stradeo-accent2'}`}
                    style={{ width: `${wt.pct}%` }} />
                </div>
              </div>
              <Link href={`/topic?id=${wt.id}`} className="px-2.5 py-1 rounded-md border border-white/[0.06] bg-white/[0.03] text-stradeo-accent text-[11px] font-semibold">Practice</Link>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
