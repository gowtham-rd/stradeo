'use client'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import { IconReview, IconCross } from './icons'

const THRESHOLD = 72 // px of pull (after resistance) that triggers
const MAX = 110

/** Pages that must not reload (the exam) set this; a pull then fires PULL_EVENT instead. */
export const PULL_GUARD_ATTR = 'data-pull-guard'
export const PULL_EVENT = 'stradeo:pull'

// Pull down from the top of any page: an indicator slides out from under the top
// bar and turns as you pull; release past the line to refresh the app. Home-screen
// web apps on iPhone have no pull-to-refresh of their own, so this provides it.
// On a guarded page (the exam) releasing asks the page instead of reloading.
export default function PullToRefresh() {
  const { lang } = useLanguage()
  const [pull, setPull] = useState(0)
  const [state, setState] = useState<'idle' | 'pulling' | 'refreshing'>('idle')
  const [guarded, setGuarded] = useState(false)
  const start = useRef<{ x: number; y: number; axis: 'x' | 'y' | null } | null>(null)
  const pullRef = useRef(0)

  useEffect(() => {
    const blocked = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null
      // Not from inside dialogs or other scrollable panels.
      return !!el?.closest('[role="dialog"], [data-no-pull]')
    }
    const onStart = (e: TouchEvent) => {
      if (state === 'refreshing' || e.touches.length !== 1 || window.scrollY > 0 || blocked(e.target)) { start.current = null; return }
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null }
      setGuarded(document.documentElement.hasAttribute(PULL_GUARD_ATTR))
    }
    const onMove = (e: TouchEvent) => {
      const s = start.current
      if (!s) return
      const dx = e.touches[0].clientX - s.x
      const dy = e.touches[0].clientY - s.y
      if (!s.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        s.axis = dy > 0 && Math.abs(dy) > Math.abs(dx) && window.scrollY <= 0 ? 'y' : 'x'
      }
      if (s.axis !== 'y') return
      if (e.cancelable) e.preventDefault() // we own this gesture: no page bounce
      const p = Math.min(MAX, dy * 0.5) // resistance
      pullRef.current = p
      setPull(p)
      setState('pulling')
    }
    const onEnd = () => {
      const s = start.current
      start.current = null
      if (!s || s.axis !== 'y') return
      const p = pullRef.current
      pullRef.current = 0
      if (p >= THRESHOLD) {
        if (document.documentElement.hasAttribute(PULL_GUARD_ATTR)) {
          window.dispatchEvent(new CustomEvent(PULL_EVENT))
          setPull(0); setState('idle')
          return
        }
        setState('refreshing')
        setPull(THRESHOLD * 0.8)
        // Pick up a new release too, then reload.
        const done = () => window.location.reload()
        navigator.serviceWorker?.getRegistration().then(r => r?.update()).finally(() => setTimeout(done, 350))
          .catch(done)
      } else {
        setPull(0); setState('idle')
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [state])

  const ready = pull >= THRESHOLD
  const label = state === 'refreshing' ? t(lang, 'refreshing')
    : guarded ? (ready ? t(lang, 'releaseExit') : '')
    : ready ? t(lang, 'releaseRefresh') : t(lang, 'pullRefresh')
  const visible = state !== 'idle' || pull > 0

  return (
    <div aria-hidden={!visible} role="status"
      className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center"
      style={{
        top: 'calc(env(safe-area-inset-top) + 56px)',
        transform: `translateY(${pull - 48}px)`,
        opacity: visible ? Math.min(1, pull / 30) : 0,
        transition: state === 'pulling' ? 'none' : 'transform 0.3s cubic-bezier(0.2,0.8,0.2,1), opacity 0.3s',
      }}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm ${
        guarded && ready ? 'border-stradeo-accent2/50 bg-stradeo-accent2/15 text-stradeo-accent2'
          : ready || state === 'refreshing' ? 'border-stradeo-brandorange/50 bg-stradeo-bg2 text-stradeo-brandorange'
          : 'border-stradeo-line bg-stradeo-bg2 text-stradeo-inkdim'}`}>
        {guarded
          ? <IconCross size={13} />
          : <IconReview size={17} className={state === 'refreshing' ? 'animate-spin-slow' : ''}
              style={state === 'refreshing' ? undefined : { transform: `rotate(${(pull / THRESHOLD) * 300}deg)` }} />}
      </span>
      {label && <span className="mt-1.5 rounded-full bg-stradeo-bg2/90 px-2 py-0.5 text-[11px] font-semibold text-stradeo-inkdim">{label}</span>}
    </div>
  )
}
