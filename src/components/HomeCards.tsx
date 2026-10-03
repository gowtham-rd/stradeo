'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, ReactNode, KeyboardEvent } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

// Horizontally swipeable cards with tappable dots. Native scroll-snap (touch, trackpad,
// wheel, keyboard arrows). The strip takes the height of the card in view, so a shorter
// card never leaves an empty gap; positions come from each card's own offset, which keeps
// snapping exact even when the page is zoomed (text size).
export default function HomeCards({ cards, goTo, className = '' }: {
  cards: { label: string; content: ReactNode }[]
  /** Change `seq` to scroll to `index` from outside. */
  goTo?: { index: number; seq: number }
  className?: string
}) {
  const { lang } = useLanguage()
  const track = useRef<HTMLDivElement>(null)
  const slides = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [height, setHeight] = useState<number | undefined>()

  const offsetOf = (i: number) => (slides.current[i]?.offsetLeft ?? 0) - (slides.current[0]?.offsetLeft ?? 0)

  const onScroll = useCallback(() => {
    const el = track.current
    if (!el) return
    let best = 0
    for (let i = 1; i < cards.length; i++) {
      if (Math.abs(offsetOf(i) - el.scrollLeft) < Math.abs(offsetOf(best) - el.scrollLeft)) best = i
    }
    setActive(best)
  }, [cards.length])

  const go = useCallback((i: number, smooth = true) => {
    const el = track.current
    if (!el) return
    const n = Math.max(0, Math.min(cards.length - 1, i))
    if (smooth) el.scrollTo({ left: offsetOf(n), behavior: 'smooth' })
    // One-step jump for programmatic moves (smooth + snap can stall in a zoomed page).
    else { el.scrollLeft = offsetOf(n); setActive(n) }
  }, [cards.length])

  // Follow the height of the visible card.
  useLayoutEffect(() => {
    const el = slides.current[active]
    if (!el) return
    const measure = () => setHeight(el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [active, cards.length])

  useEffect(() => {
    if (goTo) requestAnimationFrame(() => go(goTo.index, false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goTo?.seq])

  const onKey = (e: KeyboardEvent) => {
    // stopPropagation: a strip inside another strip shouldn't move the outer one too.
    if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(active + 1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(active - 1) }
  }

  return (
    <div className={className} role="region" aria-roledescription="carousel" aria-label={cards.map(c => c.label).join(' / ')}>
      <div ref={track} onScroll={onScroll} onKeyDown={onKey} tabIndex={0}
        style={{ height }}
        className="no-scrollbar flex items-start gap-4 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-[14px] transition-[height] duration-200 focus-visible:outline-offset-4">
        {cards.map((c, i) => (
          <div key={c.label} ref={el => { slides.current[i] = el }}
            className="w-full shrink-0 snap-start snap-always"
            role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${cards.length}: ${c.label}`}>
            {c.content}
          </div>
        ))}
      </div>
      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {cards.map((c, i) => (
            <button key={c.label} onClick={() => go(i)} aria-label={c.label} aria-current={i === active}
              className={`h-1.5 rounded-full transition-all duration-200 ${i === active ? 'w-5 bg-stradeo-ink' : 'w-1.5 bg-stradeo-line hover:bg-stradeo-inkfaint'}`} />
          ))}
          {active === 0 && <span className="sr-only">{t(lang, 'swipeHint')}</span>}
        </div>
      )}
    </div>
  )
}
