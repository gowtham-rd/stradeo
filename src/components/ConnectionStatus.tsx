'use client'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import { useOnline } from '@/lib/useOnline'
import { IconOffline, IconOnline } from './icons'

// Connection pill, top-centre just under the top bar (where pull-to-refresh
// appears). Losing the connection drops in a red pill that stays while offline,
// shrinking to a small red chip after a few seconds so it never hides the page
// (tap the chip to read it again). Coming back shows a green pill that leaves
// on its own.
export default function ConnectionStatus() {
  const { lang } = useLanguage()
  const online = useOnline()
  const [mode, setMode] = useState<'hidden' | 'offline' | 'chip' | 'back'>('hidden')
  const [leaving, setLeaving] = useState(false)
  const wasOffline = useRef(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    if (!online) {
      wasOffline.current = true
      setLeaving(false)
      setMode('offline')
    } else if (wasOffline.current) {
      wasOffline.current = false
      setLeaving(false)
      setMode('back')
      timers.push(setTimeout(() => setLeaving(true), 2600))
      timers.push(setTimeout(() => { setMode('hidden'); setLeaving(false) }, 2900))
    }
    return () => timers.forEach(clearTimeout)
  }, [online])

  // Tap the chip: open the full message for a few seconds.
  useEffect(() => {
    if (mode !== 'offline' || online) return
    const id = setTimeout(() => setMode('chip'), 4000)
    return () => clearTimeout(id)
  }, [mode, online])

  if (mode === 'hidden') return null
  const offline = mode !== 'back'
  const chip = mode === 'chip'

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[210] flex justify-center px-4"
      // Expanded: just under the top bar. Chip: sitting on the top bar's bottom edge.
      style={{ top: `calc(max(10px, env(safe-area-inset-top)) + ${chip ? 33 : 52}px)`, transition: 'top 0.24s cubic-bezier(0.2,0.8,0.2,1)' }}>
      <button type="button" role="status" aria-live="polite"
        onClick={() => chip && setMode('offline')}
        aria-label={chip ? t(lang, 'offlineTitle') : undefined}
        className={`pointer-events-auto flex items-center gap-2.5 rounded-full text-white shadow-[0_6px_20px_rgb(0_0_0/0.18)] transition-all duration-[240ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${offline ? 'bg-stradeo-accent2' : 'bg-stradeo-green'}
          ${chip ? 'h-7 w-7 justify-center p-0 ring-2 ring-stradeo-bg' : 'max-w-[330px] py-1.5 pl-1.5 pr-3.5'}
          ${leaving ? '-translate-y-3 opacity-0' : 'animate-conn-in'}`}>
        <span className={`flex shrink-0 items-center justify-center rounded-full ${chip ? '' : 'h-6 w-6 bg-white/20'}`}>
          {offline ? <IconOffline size={chip ? 13 : 14} /> : <IconOnline size={14} />}
        </span>
        {!chip && (
          <span className="min-w-0 text-left leading-tight">
            <span className="block text-[13px] font-bold">{t(lang, offline ? 'offlineTitle' : 'backOnline')}</span>
            <span className="block text-[11px] font-semibold text-white/85">{t(lang, offline ? 'offlineNote' : 'backOnlineNote')}</span>
          </span>
        )}
      </button>
    </div>
  )
}
