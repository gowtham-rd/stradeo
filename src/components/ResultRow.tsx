'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import { getImageUrl, questionKey } from '@/lib/questions'
import { getExplanation } from '@/lib/qtext'
import type { Question } from '@/types'
import SignImage from './SignImage'
import QuestionText from './QuestionText'
import ReportQuestion from './ReportQuestion'
import { IconCheck, IconCross, IconTip, IconChevronDown } from './icons'

// One question on the results page: a compact row (number, sign thumbnail, two lines
// of text, your answer → correct answer) that opens to the full sign, the text with
// the Italiano/English switch, both answers, the explanation and "Report a problem".
export default function ResultRow({ n, q, ua, ok, open, onToggle }: {
  n: number; q: Question; ua: boolean | undefined; ok: boolean; open: boolean; onToggle: () => void
}) {
  const { lang } = useLanguage()
  const img = getImageUrl(q.i)
  const [why, setWhy] = useState<string | null>(null)
  // Keep the details mounted after the first open so closing animates too.
  const [seen, setSeen] = useState(open)
  useEffect(() => { if (open) setSeen(true) }, [open])
  // Explanations show without a tap on mistakes; on correct answers once opened.
  useEffect(() => {
    if (ok && !open) return
    let alive = true
    getExplanation(q, lang).then(w => { if (alive) setWhy(w) })
    return () => { alive = false }
  }, [q, lang, ok, open])

  const tone = ok ? 'green' : ua === undefined ? 'accent' : 'accent2'
  const badge = { green: 'bg-stradeo-green/[0.12] text-stradeo-green', accent: 'border border-stradeo-accent text-stradeo-accent', accent2: 'bg-stradeo-accent2/[0.12] text-stradeo-accent2' }[tone]
  const word = (v: boolean | undefined) => (v === undefined ? t(lang, 'noAnswer') : v ? 'VERO' : 'FALSO')

  return (
    <article id={`q${n}`} className={`scroll-mt-24 rounded-[14px] border bg-stradeo-bg2 mb-2 transition-colors ${open ? 'border-stradeo-inkfaint' : 'border-stradeo-line'}`}>
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left active:scale-100">
        <span className={`flex h-7 min-w-[28px] items-center justify-center rounded-[8px] font-mono text-[12px] ${badge}`}>{n}</span>
        {img
          ? <img src={img} alt="" loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-[6px] border border-stradeo-line bg-white object-contain" />
          : null}
        <span className="min-w-0 flex-1">
          <span lang="it" className="block text-[14px] leading-snug line-clamp-2">{q.q}</span>
          {/* your answer → correct answer */}
          <span className="mt-1 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.5px]">
            {ok ? (
              <span className="inline-flex items-center gap-1 text-stradeo-green"><IconCheck size={10} />{word(ua)}</span>
            ) : (
              <>
                <span className={ua === undefined ? 'text-stradeo-accent' : 'text-stradeo-accent2'}>{ua === undefined ? t(lang, 'noAnswer') : word(ua)}</span>
                <span className="text-stradeo-inkfaint">→</span>
                <span className="text-stradeo-ink">{word(q.a)}</span>
              </>
            )}
          </span>
        </span>
        <IconChevronDown size={12} className={`shrink-0 text-stradeo-inkfaint transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Explanation on mistakes, visible without opening */}
      {!ok && why && !open && (
        <p className="-mt-1 px-3 pb-3 pl-[52px] text-[13px] leading-snug text-stradeo-inkdim line-clamp-2">
          <IconTip size={12} className="mr-1 text-stradeo-brandorange" />{why}
        </p>
      )}

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          {seen && (
            <div className="px-3 pb-3">
              <div className="border-t border-stradeo-line pt-3">
                {img && <SignImage src={img} alt={t(lang, 'signAlt')} height={150} className="mb-3" />}
                <QuestionText question={q} className="text-[15px] leading-relaxed" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className={`rounded-[8px] px-2.5 py-2 ${ok ? 'bg-stradeo-green/[0.08]' : 'bg-stradeo-accent2/[0.08]'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-[1px] text-stradeo-inkdim">{t(lang, 'yourAnswer')}</div>
                    <div className={`mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-bold ${ok ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>
                      {ok ? <IconCheck size={12} /> : <IconCross size={10} />}{word(ua)}
                    </div>
                  </div>
                  <div className="rounded-[8px] px-2.5 py-2 bg-stradeo-surface2">
                    <div className="text-[10px] font-bold uppercase tracking-[1px] text-stradeo-inkdim">{t(lang, 'correctAnswer')}</div>
                    <div className="mt-0.5 text-[13px] font-bold text-stradeo-ink">{word(q.a)}</div>
                  </div>
                </div>
                {why && (
                  <div className="mt-3 rounded-[10px] bg-stradeo-brandorange/[0.07] p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[1px] text-stradeo-brandorange"><IconTip size={12} />{t(lang, 'why')}</div>
                    <p className="text-[14px] leading-relaxed text-stradeo-ink">{why}</p>
                  </div>
                )}
                <ReportQuestion key={questionKey(q)} question={q} />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
