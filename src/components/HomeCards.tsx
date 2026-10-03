'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, ReactNode, KeyboardEvent, PointerEvent } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

const GAP = 16 // px between slides
const RESUME_AFTER_MS = 10_000 // autoplay waits this long after the user touches the cards

// Swipeable cards with dots. The track moves with a transform (smooth at any text
// size), follows the finger while dragging, and can auto-advance. While
// auto-advancing, the strip keeps the height of the tallest card so the page below
// never jumps; otherwise it takes the height of the card in view.
export default function HomeCards({ cards, goTo, autoPlay, className = '' }: {
  cards: { label: string; content: ReactNode }[]
  /** Change `seq` to move to `index` from outside. */
  goTo?: { index: number; seq: number }
  /** Milliseconds per card; pauses while touched, hovered or focused, and for a while after. */
  autoPlay?: number
  className?: string
}) {
  const { lang } = useLanguage()
  const n = cards.length
  const viewport = useRef<HTMLDivElement>(null)
  const slides = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [heights, setHeights] = useState<number[]>([])
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number; id: number; axis: 'x' | 'y' | null; t: number } | null>(null)
  const moved = useRef(false)

  // Autoplay state
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [heldUntil, setHeldUntil] = useState(0)
  const [visible, setVisible] = useState(true)
  const [reduced, setReduced] = useState(false)
  const [tick, setTick] = useState(0)

  const go = useCallback((i: number) => setActive(((i % n) + n) % n), [n])
  const hold = () => setHeldUntil(Date.now() + RESUME_AFTER_MS)

  useEffect(() => { if (active > n - 1) setActive(Math.max(0, n - 1)) }, [n, active])

  useEffect(() => {
    if (goTo) { setActive(Math.max(0, Math.min(n - 1, goTo.index))); hold() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goTo?.seq])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onMq = () => setReduced(mq.matches)
    const onVis = () => setVisible(document.visibilityState === 'visible')
    mq.addEventListener('change', onMq)
    document.addEventListener('visibilitychange', onVis)
    return () => { mq.removeEventListener('change', onMq); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  // Measure every slide (they can change size: info text, chart, selected topic…).
  useLayoutEffect(() => {
    const measure = () => setHeights(slides.current.slice(0, n).map(el => el?.offsetHeight ?? 0))
    measure()
    const ro = new ResizeObserver(measure)
    slides.current.slice(0, n).forEach(el => el && ro.observe(el))
    return () => ro.disconnect()
  }, [n])

  const held = Date.now() < heldUntil
  const playing = !!autoPlay && n > 1 && !reduced && visible && !hovered && !focused && !dragging && !held

  useEffect(() => {
    if (!playing) return
    const id = setTimeout(() => setActive(a => (a + 1) % n), autoPlay)
    return () => clearTimeout(id)
  }, [playing, active, autoPlay, n, tick])

  // Wake up when a hold expires.
  useEffect(() => {
    if (!held) return
    const id = setTimeout(() => setTick(x => x + 1), heldUntil - Date.now() + 20)
    return () => clearTimeout(id)
  }, [held, heldUntil])

  const height = autoPlay
    ? (heights.length ? Math.max(...heights) : undefined)
    : heights[active]

  // ── Dragging ──────────────────────────────────────────────────────────────
  const onPointerDown = (e: PointerEvent) => {
    hold()
    // A strip inside another strip moves on its own: only the innermost one drags.
    const native = e.nativeEvent as unknown as { stradeoCarousel?: boolean }
    if (native.stradeoCarousel) return
    native.stradeoCarousel = true
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, axis: null, t: performance.now() }
    moved.current = false
  }
  const onPointerMove = (e: PointerEvent) => {
    const s = start.current
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (s.axis === 'x') { setDragging(true); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
    }
    if (s.axis !== 'x') return
    moved.current = true
    // Resist at the ends.
    const atEdge = (active === 0 && dx > 0) || (active === n - 1 && dx < 0)
    setDrag(atEdge ? dx / 3 : dx)
  }
  const endDrag = (e: PointerEvent) => {
    const s = start.current
    start.current = null
    if (!s || s.axis !== 'x') return
    const dx = e.clientX - s.x
    const width = viewport.current?.offsetWidth || 1
    const fast = Math.abs(dx) / Math.max(1, performance.now() - s.t) > 0.45
    if ((Math.abs(dx) > width * 0.22 || (fast && Math.abs(dx) > 24))) {
      setActive(a => Math.max(0, Math.min(n - 1, a + (dx < 0 ? 1 : -1))))
    }
    setDrag(0)
    setDragging(false)
    hold()
  }
  // A drag shouldn't also count as a tap on whatever is under the finger.
  const onClickCapture = (e: React.MouseEvent) => {
    if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false }
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); hold(); setActive(a => Math.min(n - 1, a + 1)) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); hold(); setActive(a => Math.max(0, a - 1)) }
  }

  return (
    <div className={className} role="region" aria-roledescription="carousel" aria-label={cards.map(c => c.label).join(' / ')}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false) }}>
      <div ref={viewport} tabIndex={0} onKeyDown={onKey}
        className="overflow-hidden -mx-1 px-1 transition-[height] duration-300 ease-out focus-visible:outline-offset-4"
        style={{ height }}>
        <div
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          className={`flex items-start select-none touch-pan-y ${dragging ? '' : 'transition-transform duration-500 ease-[cubic-bezier(0.22,0.8,0.24,1)]'}`}
          style={{ gap: GAP, transform: `translate3d(calc(${-active * 100}% - ${active * GAP}px + ${drag}px), 0, 0)` }}>
          {cards.map((c, i) => (
            <div key={c.label} ref={el => { slides.current[i] = el }}
              className={`w-full shrink-0 ${autoPlay ? 'self-stretch [&>*]:h-full' : ''}`}
              role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${n}: ${c.label}`} aria-hidden={i !== active}
              // Off-screen slides can't take focus.
              {...(i !== active ? { inert: '' as unknown as boolean } : {})}>
              {c.content}
            </div>
          ))}
        </div>
      </div>
      {n > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {cards.map((c, i) => (
            <button key={c.label} onClick={() => { hold(); go(i) }} aria-label={c.label} aria-current={i === active}
              className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-stradeo-line' : 'w-1.5 bg-stradeo-line hover:bg-stradeo-inkfaint'}`}>
              {i === active && (
                <span key={`${active}-${playing}-${tick}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-stradeo-ink"
                  style={playing ? { animation: `dotfill ${autoPlay}ms linear both` } : { width: '100%' }} />
              )}
            </button>
          ))}
          {active === 0 && <span className="sr-only">{t(lang, 'swipeHint')}</span>}
        </div>
      )}
    </div>
  )
}
