'use client'
import { useRef, useState, ReactNode, useCallback, KeyboardEvent } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

// Horizontally swipeable cards (Readiness → Stats) with tappable dots.
// Native scroll-snap: works with touch, trackpad, mouse wheel and keyboard arrows.
export default function HomeCards({ cards }: { cards: { label: string; content: ReactNode }[] }) {
  const { lang } = useLanguage()
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const onScroll = useCallback(() => {
    const el = track.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }, [])

  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const n = Math.max(0, Math.min(cards.length - 1, i))
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1) }
  }

  return (
    <div className="mb-5" role="region" aria-roledescription="carousel" aria-label={cards.map(c => c.label).join(' / ')}>
      <div ref={track} onScroll={onScroll} onKeyDown={onKey} tabIndex={0}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[14px] focus-visible:outline-offset-4">
        {cards.map((c, i) => (
          <div key={c.label} className="w-full shrink-0 snap-start snap-always"
            role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${cards.length}: ${c.label}`}>
            {c.content}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-3">
        {cards.map((c, i) => (
          <button key={c.label} onClick={() => go(i)} aria-label={c.label} aria-current={i === active}
            className={`h-1.5 rounded-full transition-all duration-200 ${i === active ? 'w-5 bg-stradeo-ink' : 'w-1.5 bg-stradeo-line hover:bg-stradeo-inkfaint'}`} />
        ))}
        {active === 0 && <span className="sr-only">{t(lang, 'swipeHint')}</span>}
      </div>
    </div>
  )
}
