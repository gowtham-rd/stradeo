'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import { getTopicName } from '@/lib/topics'
import { loadTopicQuestions, getImageUrl } from '@/lib/questions'
import type { TheoryContent } from '@/types'
import { IconTip, IconWarning, IconChevronDown, IconArrowRight, IconQuiz, IconCross, IconCheck } from './icons'

// Acronyms and sign words that are written in capitals on purpose.
const KEEP_CAPS = new Set(['STOP', 'ZTL', 'ABS', 'ESP', 'GPL', 'ADR', 'RCA', 'ASR', 'EBD', 'LED', 'GPS', 'ESC', 'ECE', 'CE', 'UE', 'EU', 'SOS', 'VERO', 'FALSO', 'TRUE', 'FALSE', 'CDS', 'MCTC', 'ACI', 'ANAS', 'EUR', 'KW', 'CV'])

// No lookbehind (older iPhones lack it): the character before the run is captured instead.
const SHOUT = new RegExp('(^|[^\\p{L}])(\\p{Lu}{2,}(?:[ -]\\p{Lu}{2,})*)(?![\\p{L}])', 'gu')

/** Shouted words in plain text → calm bold ones ("NOT" → **not**); acronyms stay. */
function calmCaps(text: string, key: string) {
  const out: React.ReactNode[] = []
  let last = 0, m: RegExpExecArray | null
  SHOUT.lastIndex = 0
  while ((m = SHOUT.exec(text))) {
    const run = m[2], start = m.index + m[1].length
    if (run.split(/[ -]/).every(w => KEEP_CAPS.has(w.toUpperCase()))) continue
    out.push(text.slice(last, start), <strong key={`${key}-${start}`} className="font-semibold text-stradeo-ink">{run.toLowerCase()}</strong>)
    last = start + run.length
  }
  out.push(text.slice(last))
  return out
}

/** Inline text: **bold**, *italic*, and shouted capitals calmed down. */
function Rich({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-stradeo-ink">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    return <span key={i}>{calmCaps(part, String(i))}</span>
  })}</>
}

/** "**Heading**\n\nparagraph…" blocks → [{ title, paras }]. */
function sectionsOf(details: string) {
  const out: { title: string; paras: string[] }[] = []
  for (const block of details.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)) {
    const head = block.match(/^\*\*([^*]+)\*\*\s*$/)
    if (head) out.push({ title: head[1].trim(), paras: [] })
    else if (/^\*\*([^*]+)\*\*\n/.test(block)) {
      const [, title, rest] = block.match(/^\*\*([^*]+)\*\*\n([\s\S]*)$/)!
      out.push({ title: title.trim(), paras: [rest.trim()] })
    } else {
      if (!out.length) out.push({ title: '', paras: [] })
      out[out.length - 1].paras.push(block)
    }
  }
  return out.filter(s => s.paras.length)
}

/** ⚠ "statement" — FALSE. The real rule… → { claim, verdict, fact } */
function trapsOf(traps: string) {
  return traps.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const m = line.replace(/^⚠\s*/, '').match(/^["“«](.+?)["”»]\s*[—–-]\s*([^.!]+)[.!]\s*([\s\S]*)$/)
    return m ? { claim: m[1], verdict: m[2].trim(), fact: m[3].trim() } : { claim: '', verdict: '', fact: line.replace(/^⚠\s*/, '') }
  })
}

const wordsOf = (s: string) => s.split(/\s+/).filter(Boolean).length

// The lesson for one topic, laid out for studying on a phone: the one-line summary
// and the exam traps first, the pictures from this topic's questions (tap one to
// practise just those), short key points, then the long explanation as sections
// you open one at a time. A bar at the bottom shows how far you've read and keeps
// "Practise this topic" in reach.
export default function LessonView({ tid, theory }: { tid: number; theory: TheoryContent }) {
  const { lang } = useLanguage()
  const sections = useMemo(() => sectionsOf(theory.details || ''), [theory.details])
  const traps = useMemo(() => trapsOf(theory.traps || ''), [theory.traps])
  const points = useMemo(() => (theory.keypoints || '').split('\n').map(l => l.replace(/^[•·\-]\s*/, '').trim()).filter(Boolean), [theory.keypoints])
  const minutes = Math.max(1, Math.round(wordsOf([theory.keypoints, theory.details, theory.traps, theory.remember].join(' ')) / 200))

  const [open, setOpen] = useState<number | null>(null)
  const [allPoints, setAllPoints] = useState(false)
  const shownPoints = allPoints ? points : points.slice(0, 5)

  // Pictures used by this topic's questions, most-asked first.
  const [pictures, setPictures] = useState<{ img: string; url: string; n: number }[]>([])
  useEffect(() => {
    let alive = true
    loadTopicQuestions(tid).then(qs => {
      const count = new Map<string, number>()
      for (const q of qs) if (q.i) count.set(q.i, (count.get(q.i) ?? 0) + 1)
      const list = Array.from(count.entries()).sort((a, b) => b[1] - a[1])
        .map(([img, n]) => ({ img, url: getImageUrl(img)!, n }))
      if (alive) setPictures(list)
    }, () => {})
    return () => { alive = false }
  }, [tid])

  // How far down the lesson you are, for the bar at the bottom.
  const endRef = useRef<HTMLDivElement>(null)
  const [read, setRead] = useState(0)
  useEffect(() => {
    const on = () => {
      const el = endRef.current
      if (!el) return
      const total = el.getBoundingClientRect().top + window.scrollY - window.innerHeight
      setRead(total <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / total)))
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [open, allPoints])

  const jump = (i: number) => {
    setOpen(i)
    requestAnimationFrame(() => document.getElementById(`sec-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const card = 'rounded-[14px] border border-stradeo-line bg-stradeo-bg2'
  const label = 'text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim'

  return (
    <div className="pb-24">
      {/* Title + what's in it */}
      <div className="mb-3.5 px-0.5">
        <p className="text-[13px] leading-snug text-stradeo-inkdim">{theory.title}</p>
        <p className="mt-1.5 font-mono text-[12px] text-stradeo-inkfaint">
          {t(lang, 'readMinutes').replace('{n}', String(minutes))} · {sections.length} {t(lang, 'lessonSections')} · {traps.length} {t(lang, 'examTraps').toLowerCase()}
        </p>
      </div>

      {/* The one thing to remember */}
      {theory.remember && (
        <div className="mb-3.5 rounded-[14px] bg-stradeo-brand/[0.16] border border-stradeo-brand/40 p-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-stradeo-ink">
            <IconTip size={13} className="text-stradeo-brandorange" />{t(lang, 'remember')}
          </div>
          <p className="text-[15px] font-semibold leading-snug text-stradeo-ink"><Rich text={theory.remember} /></p>
        </div>
      )}

      {/* Exam traps: the wrong statement, then the rule */}
      {traps.length > 0 && (
        <section className="mb-3.5">
          <h2 className={`${label} mb-2 flex items-center gap-1.5`}><IconWarning size={12} className="text-stradeo-accent2" />{t(lang, 'examTraps')}</h2>
          <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-1 [scrollbar-width:none]" data-no-pull>
            {traps.map((tr, i) => (
              <div key={i} className={`${card} snap-start shrink-0 w-[82%] max-w-[340px] p-3.5`}>
                {tr.claim && (
                  <p className="flex gap-2 text-[13.5px] leading-snug text-stradeo-inkdim">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-stradeo-accent2/15 text-stradeo-accent2"><IconCross size={8} /></span>
                    <span className="line-through decoration-stradeo-accent2/50">“{tr.claim}”</span>
                  </p>
                )}
                <p className="mt-2 flex gap-2 text-[13.5px] leading-snug text-stradeo-ink">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-stradeo-green/15 text-stradeo-green"><IconCheck size={9} /></span>
                  <span><Rich text={tr.fact} /></span>
                </p>
              </div>
            ))}
          </div>
          {traps.length > 1 && <p className="mt-1 text-[11px] text-stradeo-inkfaint">{t(lang, 'swipeMore').replace('{n}', String(traps.length))}</p>}
        </section>
      )}

      {/* Pictures from this topic's questions: tap to practise just those */}
      {pictures.length > 0 && (
        <section className="mb-3.5">
          <h2 className={`${label} mb-2`}>{t(lang, 'picturesInTopic')} · <span className="font-mono">{pictures.length}</span></h2>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none]" data-no-pull>
            {pictures.map(p => (
              <Link key={p.img} href={`/quiz?topic=${tid}&img=${encodeURIComponent(p.img)}`}
                className={`${card} shrink-0 w-[92px] p-2 flex flex-col items-center gap-1.5 active:scale-95 transition-transform`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" loading="lazy" decoding="async" className="h-[62px] w-full rounded-[6px] bg-white object-contain" />
                <span className="font-mono text-[11px] text-stradeo-inkdim">{p.n} Q</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Key points */}
      {points.length > 0 && (
        <section className={`${card} mb-3.5 p-4`}>
          <h2 className={`${label} mb-2.5`}>{t(lang, 'keyPoints')}</h2>
          <ol className="space-y-2.5">
            {shownPoints.map((line, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-stradeo-surface2 font-mono text-[10px] text-stradeo-inkdim">{i + 1}</span>
                <p className="text-[14px] leading-relaxed text-stradeo-ink"><Rich text={line} /></p>
              </li>
            ))}
          </ol>
          {points.length > 5 && (
            <button type="button" onClick={() => setAllPoints(v => !v)}
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-stradeo-blue">
              {allPoints ? t(lang, 'showLess') : t(lang, 'showAllN').replace('{n}', String(points.length))}
              <IconChevronDown size={11} className={`transition-transform duration-300 ${allPoints ? 'rotate-180' : ''}`} />
            </button>
          )}
        </section>
      )}

      {/* The full explanation, one section at a time */}
      {sections.length > 0 && (
        <section className="mb-3.5">
          <h2 className={`${label} mb-2`}>{t(lang, 'explained')}</h2>
          <div className={`${card} divide-y divide-stradeo-line overflow-hidden`}>
            {sections.map((s, i) => {
              const isOpen = open === i
              return (
                <div key={i} id={`sec-${i}`} className="scroll-mt-20">
                  <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] font-mono text-[11px] ${isOpen ? 'bg-stradeo-ink text-stradeo-bg' : 'bg-stradeo-surface2 text-stradeo-inkdim'}`}>{i + 1}</span>
                    <span className="flex-1 text-[14.5px] font-semibold leading-snug">{s.title || theory.title}</span>
                    <IconChevronDown size={12} className={`shrink-0 text-stradeo-inkfaint transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 pl-[52px] space-y-3">
                        {s.paras.map((para, j) => <p key={j} className="text-[14px] leading-[1.65] text-stradeo-ink"><Rich text={para} /></p>)}
                        {i < sections.length - 1 && (
                          <button type="button" onClick={() => jump(i + 1)} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-stradeo-blue">
                            {t(lang, 'nextSection')}: {sections[i + 1].title} <IconArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
      <div ref={endRef} />

      {/* Reading progress + practise, always in reach */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stradeo-line bg-stradeo-nav backdrop-blur-[20px] px-4 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-[640px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between text-[11px] text-stradeo-inkdim">
              <span className="truncate">{getTopicName(tid, lang)}</span>
              <span className="font-mono">{Math.round(read * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stradeo-surface2">
              <div className="h-full rounded-full bg-stradeo-brandorange transition-[width] duration-200" style={{ width: `${read * 100}%` }} />
            </div>
          </div>
          <Link href={`/quiz?topic=${tid}`} className="flex h-11 shrink-0 items-center gap-2 rounded-[10px] bg-stradeo-brand px-4 text-[14px] font-bold text-stradeo-onbrand">
            <IconQuiz size={14} />{t(lang, 'practise')}
          </Link>
        </div>
      </div>
    </div>
  )
}
