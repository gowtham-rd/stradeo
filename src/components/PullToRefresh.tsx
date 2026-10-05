'use client'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

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

  // Slide the page with the finger; ease back (or hold open while refreshing).
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--pull', `${pull}px`)
    if (state === 'pulling') { root.classList.add('pulling'); root.classList.remove('pull-settle'); return }
    root.classList.remove('pulling')
    if (pull > 0) { root.classList.add('pull-settle'); return }
    root.classList.add('pull-settle')
    const id = setTimeout(() => root.classList.remove('pull-settle'), 360)
    return () => clearTimeout(id)
  }, [pull, state])

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
  const progress = Math.min(1, pull / THRESHOLD)
  const label = state === 'refreshing' ? t(lang, 'refreshing')
    : guarded ? (ready ? t(lang, 'releaseExit') : '')
    : ready ? t(lang, 'releaseRefresh') : t(lang, 'pullRefresh')
  const visible = state !== 'idle' || pull > 0

  // The app's loading ring (same as the lesson spinner): it fills as you pull,
  // turns orange when a release will refresh (red on the exam, where it exits),
  // then spins while loading.
  const ring = guarded && ready ? 'border-t-stradeo-accent2' : ready || state === 'refreshing' ? 'border-t-stradeo-brandorange' : 'border-t-stradeo-ink'
  const arc = guarded && ready ? 'stroke-stradeo-accent2' : ready ? 'stroke-stradeo-brandorange' : 'stroke-stradeo-ink'
  const C = 2 * Math.PI * 11.5
  return (
    <div aria-hidden={!visible} role="status"
      className="pointer-events-none fixed inset-x-0 z-0 flex flex-col items-center"
      style={{
        // Centred in the gap the page leaves at the top as it slides down.
        top: `calc(env(safe-area-inset-top) + ${Math.max(0, pull - 64) / 2}px)`,
        opacity: visible ? Math.min(1, Math.max(0, (pull - 20) / 30)) : 0,
        transition: state === 'pulling' ? 'none' : 'top 0.35s cubic-bezier(0.2,0.8,0.2,1), opacity 0.3s',
      }}>
      {state === 'refreshing'
        ? <span className={`block h-7 w-7 rounded-full border-[3px] border-stradeo-line ${ring} animate-spin-slow`} />
        : (
          <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
            <circle cx="14" cy="14" r="11.5" fill="none" strokeWidth="3" className="stroke-stradeo-line" />
            <circle cx="14" cy="14" r="11.5" fill="none" strokeWidth="3" className={`${arc} transition-colors duration-150`}
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
          </svg>
        )}
      {label && <span className="mt-1.5 text-[11px] font-semibold leading-4 text-stradeo-inkdim whitespace-nowrap">{label}</span>}
    </div>
  )
}
