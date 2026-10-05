'use client'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import { useOnline } from '@/lib/useOnline'
import { TOAST_EVENT, type Toast } from '@/lib/toast'
import { IconOffline, IconOnline, IconCheck, IconWarning } from './icons'

// One pill, top-centre just under the top bar (where pull-to-refresh appears).
// - Offline: red pill that stays, shrinking after a few seconds to a small red
//   chip on the top bar's edge (tap it to read the message again).
// - Back online: green pill that leaves on its own.
// - Confirmations from toast() ("Name saved"): green (or red on failure), brief.
// The connection message wins while it's open; a toast waits for it to settle.
export default function ConnectionStatus() {
  const { lang } = useLanguage()
  const online = useOnline()
  const [mode, setMode] = useState<'hidden' | 'offline' | 'chip' | 'back'>('hidden')
  const [note, setNote] = useState<(Toast & { id: number }) | null>(null)
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

  // Full offline message shrinks to the chip after a few seconds (also after a tap).
  useEffect(() => {
    if (mode !== 'offline' || online) return
    const id = setTimeout(() => setMode('chip'), 4000)
    return () => clearTimeout(id)
  }, [mode, online])

  // Confirmations.
  useEffect(() => {
    const on = (e: Event) => { setLeaving(false); setNote({ ...(e as CustomEvent<Toast>).detail, id: Date.now() }) }
    window.addEventListener(TOAST_EVENT, on)
    return () => window.removeEventListener(TOAST_EVENT, on)
  }, [])
  useEffect(() => {
    if (!note) return
    const a = setTimeout(() => setLeaving(true), 2200)
    const b = setTimeout(() => { setNote(null); setLeaving(false) }, 2500)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [note])

  const busy = mode === 'offline' || mode === 'back'
  const showNote = !!note && !busy
  if (mode === 'hidden' && !showNote) return null

  let pill: { tone: 'ok' | 'error'; icon: React.ReactNode; title: string; sub?: string; chip?: boolean; key: string }
  if (showNote) pill = { tone: note!.tone, icon: note!.tone === 'ok' ? <IconCheck size={12} /> : <IconWarning size={13} />, title: note!.title, sub: note!.note, key: `n${note!.id}` }
  else if (mode === 'back') pill = { tone: 'ok', icon: <IconOnline size={14} />, title: t(lang, 'backOnline'), sub: t(lang, 'backOnlineNote'), key: 'back' }
  else pill = { tone: 'error', icon: <IconOffline size={mode === 'chip' ? 13 : 14} />, title: t(lang, 'offlineTitle'), sub: t(lang, 'offlineNote'), chip: mode === 'chip', key: 'off' }
  const chip = !!pill.chip

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[210] flex justify-center px-4"
      // Expanded: just under the top bar. Chip: sitting on the top bar's bottom edge.
      style={{ top: `calc(max(10px, env(safe-area-inset-top)) + ${chip ? 33 : 52}px)`, transition: 'top 0.24s cubic-bezier(0.2,0.8,0.2,1)' }}>
      <button key={pill.key} type="button" role="status" aria-live="polite"
        onClick={() => chip && setMode('offline')}
        aria-label={chip ? pill.title : undefined}
        className={`pointer-events-auto flex items-center gap-2.5 rounded-full text-white shadow-[0_6px_20px_rgb(0_0_0/0.18)] transition-all duration-[240ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${pill.tone === 'error' ? 'bg-stradeo-accent2' : 'bg-stradeo-green'}
          ${chip ? 'h-7 w-7 justify-center p-0 ring-2 ring-stradeo-bg' : `max-w-[330px] py-1.5 pl-1.5 ${pill.sub ? 'pr-3.5' : 'pr-4'}`}
          ${leaving ? '-translate-y-3 opacity-0' : 'animate-conn-in'}`}>
        <span className={`flex shrink-0 items-center justify-center rounded-full ${chip ? '' : 'h-6 w-6 bg-white/20'}`}>{pill.icon}</span>
        {!chip && (
          <span className="min-w-0 text-left leading-tight">
            <span className="block text-[13px] font-bold">{pill.title}</span>
            {pill.sub && <span className="block truncate text-[11px] font-semibold text-white/85">{pill.sub}</span>}
          </span>
        )}
      </button>
    </div>
  )
}
