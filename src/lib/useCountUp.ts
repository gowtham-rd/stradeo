'use client'
import { useEffect, useRef, useState } from 'react'

/** True the first time `key` is asked about in this visit (browser session):
 *  intro animations play once, not again on every reload or return to Home. */
export function firstTimeThisVisit(key: string): boolean {
  try {
    const k = `stradeo-played-${key}`
    if (sessionStorage.getItem(k)) return false
    sessionStorage.setItem(k, '1')
  } catch { /* storage blocked: just animate */ }
  return true
}

/** Animates a number from its previous value (0 on first render) to `target`.
 *  Ease-out, ~1.2 s. Jumps straight to the value when the user prefers reduced motion.
 *  With `onceKey`, the count-up from 0 plays only once per visit; afterwards the
 *  number starts at its value (later changes still animate). */
export function useCountUp(target: number, durationMs = 1200, onceKey?: string): number {
  const [value, setValue] = useState(0)
  const from = useRef(0)
  const skipIntro = useRef<boolean | null>(null)

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || durationMs <= 0) { from.current = target; setValue(target); return }
    // First real value: decide once whether this is the visit's intro count-up.
    if (onceKey && target !== 0 && skipIntro.current === null) {
      skipIntro.current = !firstTimeThisVisit(`count-${onceKey}`)
      if (skipIntro.current) { from.current = target; setValue(target); return }
    }
    const start = performance.now()
    const begin = from.current
    let frame = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = begin + (target - begin) * eased
      setValue(v)
      if (p < 1) frame = requestAnimationFrame(tick)
      else from.current = target
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); from.current = target }
  }, [target, durationMs, onceKey])

  return value
}
