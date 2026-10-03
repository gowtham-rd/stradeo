'use client'
import { useEffect, useRef, useState } from 'react'

/** Animates a number from its previous value (0 on first render) to `target`.
 *  Ease-out, ~1.2 s. Jumps straight to the value when the user prefers reduced motion. */
export function useCountUp(target: number, durationMs = 1200): number {
  const [value, setValue] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || durationMs <= 0) { from.current = target; setValue(target); return }
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
  }, [target, durationMs])

  return value
}
