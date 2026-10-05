'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, t } from '@/lib/i18n'
import { getExplanations } from '@/lib/qtext'
import type { Language, Question } from '@/types'
import { IconTip, IconCheck, IconCross } from './icons'

// "Why" box: the explanation behind the official answer, in the learner's language,
// with an Italiano ↔ English switch (the exam is in Italian, so seeing the rule in
// both helps). Coloured by the result: green when the answer was right, red when
// it was wrong. With `verdict`, it also opens with "Correct!" / "Not quite" (and
// then shows even when there's no explanation for the question).
export default function WhyBox({ question, className = '', result, verdict = false }: {
  question: Question; className?: string; result?: 'right' | 'wrong'; verdict?: boolean
}) {
  const { lang } = useLanguage()
  const [data, setData] = useState<Awaited<ReturnType<typeof getExplanations>> | null>(null)
  const [showAlt, setShowAlt] = useState(false)

  useEffect(() => {
    let alive = true
    setData(null); setShowAlt(false)
    getExplanations(question, lang).then(d => { if (alive) setData(d) })
    return () => { alive = false }
  }, [question, lang])

  if (!data?.main && !(verdict && result)) return null
  // Italiano always first in the switch.
  const langs: Language[] = !data ? [] : data.alt ? (data.mainLang === 'it' ? ['it', data.altLang] : ['it', data.mainLang]) : [data.mainLang]
  const current = data && showAlt && data.alt ? data.altLang : data?.mainLang ?? lang
  const text = !data?.main ? null : current === data.mainLang ? data.main : data.alt!
  const box = result === 'right' ? 'bg-stradeo-green/[0.08] border border-stradeo-green/25'
    : result === 'wrong' ? 'bg-stradeo-accent2/[0.07] border border-stradeo-accent2/25'
    : 'bg-stradeo-surface2'

  return (
    <div className={`rounded-[12px] p-3.5 animate-rise ${box} ${className}`}>
      <div className={`flex items-center gap-1.5 ${text ? 'mb-1.5' : ''}`}>
        {verdict && result ? (
          <span className={`inline-flex items-center gap-1.5 text-[13px] font-bold ${result === 'right' ? 'text-stradeo-green' : 'text-stradeo-accent2'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${result === 'right' ? 'bg-stradeo-green/15' : 'bg-stradeo-accent2/15'}`}>
              {result === 'right' ? <IconCheck size={10} /> : <IconCross size={8} />}
            </span>
            {t(lang, result === 'right' ? 'correctBadge' : 'notQuite')}
            {text && <span className="ml-1 text-[11px] font-bold uppercase tracking-[1px] text-stradeo-inkdim">· {t(lang, 'why')}</span>}
          </span>
        ) : (
          <>
            <IconTip size={13} className={result === 'right' ? 'text-stradeo-green' : result === 'wrong' ? 'text-stradeo-accent2' : 'text-stradeo-brandorange'} />
            <span className={`text-[11px] font-bold uppercase tracking-[1px] ${result === 'right' ? 'text-stradeo-green' : result === 'wrong' ? 'text-stradeo-accent2' : 'text-stradeo-brandorange'}`}>{t(lang, 'why')}</span>
          </>
        )}
        {langs.length > 1 && (
          <div role="radiogroup" aria-label={t(lang, 'translate')}
            className="ml-auto inline-flex h-6 items-center rounded-[7px] border border-stradeo-line bg-stradeo-bg p-0.5 text-[11px]">
            {langs.map(l => (
              <button key={l} type="button" role="radio" aria-checked={current === l}
                onClick={() => setShowAlt(l !== data?.mainLang)}
                className={`h-full rounded-[5px] px-2 font-semibold transition-colors ${current === l ? 'bg-stradeo-ink text-stradeo-bg' : 'text-stradeo-inkdim hover:text-stradeo-ink'}`}>
                {l === 'it' ? 'Italiano' : LANGUAGES[l]}
              </button>
            ))}
          </div>
        )}
      </div>
      {text && <p key={current} lang={current} className="text-[14px] leading-relaxed text-stradeo-ink animate-fade-in">{text}</p>}
    </div>
  )
}
