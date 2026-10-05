'use client'
import { useMemo, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { t } from '@/lib/i18n'
import { getImageUrl } from '@/lib/questions'
import type { Question } from '@/types'
import QuestionText from './QuestionText'
import WhyBox from './WhyBox'
import { IconCheck, IconCross, IconReview, IconArrowRight } from './icons'

const shuffle = <T,>(a: T[]) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }

// "Check yourself" at the end of a lesson section: 3 real exam questions about
// what was just read, answered in place. Answers count like any other practice.
export default function SectionCheck({ pool, onDone }: { pool: Question[]; onDone?: () => void }) {
  const { lang } = useLanguage()
  const { recordAnswer } = useProgress()
  const [round, setRound] = useState(0)
  const qs = useMemo(() => shuffle(pool).slice(0, 3), [pool, round]) // eslint-disable-line react-hooks/exhaustive-deps
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState<boolean | null>(null)
  const [right, setRight] = useState(0)
  if (!qs.length) return null
  const finished = idx >= qs.length
  const q = qs[Math.min(idx, qs.length - 1)]
  const img = getImageUrl(q.i)

  const choose = (v: boolean) => {
    if (answer !== null) return
    setAnswer(v)
    const ok = v === q.a
    if (ok) setRight(r => r + 1)
    recordAnswer(q, ok)
  }
  const next = () => {
    setAnswer(null)
    if (idx + 1 >= qs.length) onDone?.()
    setIdx(i => i + 1)
  }
  const again = () => { setRound(r => r + 1); setIdx(0); setAnswer(null); setRight(0) }

  return (
    <div className="mt-1 rounded-[12px] border border-stradeo-line bg-stradeo-bg p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-stradeo-inkdim">{t(lang, 'checkYourself')}</span>
        <span className="flex gap-1" aria-hidden="true">
          {qs.map((_, i) => <span key={i} className={`h-1.5 w-5 rounded-full ${i < idx || (i === idx && answer !== null) ? 'bg-stradeo-ink' : 'bg-stradeo-surface2'}`} />)}
        </span>
      </div>

      {finished ? (
        <div className="animate-fade-in text-center py-1">
          <p className={`font-mono text-[26px] leading-none ${right === qs.length ? 'text-stradeo-green' : right === 0 ? 'text-stradeo-accent2' : 'text-stradeo-ink'}`}>{right}/{qs.length}</p>
          <p className="mt-1.5 text-[13px] text-stradeo-inkdim">{t(lang, right === qs.length ? 'checkAllRight' : 'checkSomeWrong')}</p>
          <button type="button" onClick={again} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-stradeo-blue">
            <IconReview size={12} />{t(lang, 'checkAgain')}
          </button>
        </div>
      ) : (
        <div key={`${round}-${idx}`} className="animate-fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img && <img src={img} alt="" className="mx-auto mb-2.5 max-h-[110px] max-w-[160px] rounded-[8px] border border-stradeo-line bg-white object-contain" />}
          <QuestionText question={q} className="text-[14.5px] leading-relaxed" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[true, false].map(v => {
              let cls = 'border-stradeo-line bg-stradeo-surface2 text-stradeo-ink'
              if (answer !== null) {
                if (q.a === v) cls = 'border-stradeo-green bg-stradeo-green/10 text-stradeo-green'
                else if (answer === v) cls = 'border-stradeo-accent2 bg-stradeo-accent2/10 text-stradeo-accent2'
              }
              return (
                <button key={String(v)} type="button" onClick={() => choose(v)} disabled={answer !== null}
                  className={`h-11 rounded-[10px] border text-[14px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${cls}`}>
                  {v ? <>VERO <IconCheck size={13} /></> : <>FALSO <IconCross size={11} /></>}
                </button>
              )
            })}
          </div>
          {answer !== null && (
            <>
              <WhyBox question={q} className="mt-2.5" result={answer === q.a ? 'right' : 'wrong'} verdict />
              <button type="button" onClick={next}
                className="mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-stradeo-ink text-[13.5px] font-semibold text-stradeo-bg">
                {idx + 1 >= qs.length ? t(lang, 'checkSeeScore') : t(lang, 'next')} <IconArrowRight size={12} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
