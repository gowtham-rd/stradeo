'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, t } from '@/lib/i18n'
import { getExplanations } from '@/lib/qtext'
import type { Language, Question } from '@/types'
import { IconTip } from './icons'

// "Why" box: the explanation behind the official answer, in the learner's language,
// with an Italiano ↔ English switch (the exam is in Italian, so seeing the rule in
// both helps). Renders nothing when there is no explanation for the question yet.
export default function WhyBox({ question, className = '', tone = 'orange' }: {
  question: Question; className?: string; tone?: 'orange' | 'plain'
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

  if (!data?.main) return null
  // Italiano always first in the switch.
  const langs: Language[] = data.alt ? (data.mainLang === 'it' ? ['it', data.altLang] : ['it', data.mainLang]) : [data.mainLang]
  const current = showAlt && data.alt ? data.altLang : data.mainLang
  const text = current === data.mainLang ? data.main : data.alt!

  return (
    <div className={`rounded-[12px] p-3.5 animate-rise ${tone === 'orange' ? 'bg-stradeo-brandorange/[0.07]' : 'bg-stradeo-surface2'} ${className}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <IconTip size={13} className="text-stradeo-brandorange" />
        <span className="text-[11px] font-bold uppercase tracking-[1px] text-stradeo-brandorange">{t(lang, 'why')}</span>
        {langs.length > 1 && (
          <div role="radiogroup" aria-label={t(lang, 'translate')}
            className="ml-auto inline-flex h-6 items-center rounded-[7px] border border-stradeo-line bg-stradeo-bg p-0.5 text-[11px]">
            {langs.map(l => (
              <button key={l} type="button" role="radio" aria-checked={current === l}
                onClick={() => setShowAlt(l !== data.mainLang)}
                className={`h-full rounded-[5px] px-2 font-semibold transition-colors ${current === l ? 'bg-stradeo-ink text-stradeo-bg' : 'text-stradeo-inkdim hover:text-stradeo-ink'}`}>
                {l === 'it' ? 'Italiano' : LANGUAGES[l]}
              </button>
            ))}
          </div>
        )}
      </div>
      <p key={current} lang={current} className="text-[14px] leading-relaxed text-stradeo-ink animate-fade-in">{text}</p>
    </div>
  )
}
