'use client'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, t } from '@/lib/i18n'
import { getTranslation } from '@/lib/qtext'
import type { Question } from '@/types'
import { IconRoadworks } from './icons'

// The question text with an "Italiano | English" switch that swaps the text in
// place. Without a translation yet, tapping the other language shows a short
// "coming soon" note and stays on Italian. Hidden when learning through Italian.
export default function QuestionText({ question, className = 'text-[17px] leading-relaxed' }: { question: Question; className?: string }) {
  const { lang } = useLanguage()
  const [mode, setMode] = useState<'it' | 'tr'>('it')
  const [translation, setTranslation] = useState<string | null>(null)
  const [soon, setSoon] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  async function choose(next: 'it' | 'tr') {
    if (next === mode) return
    if (next === 'it') { setMode('it'); return }
    const tr = translation ?? await getTranslation(question, lang)
    if (tr) { setTranslation(tr); setMode('tr'); return }
    setSoon(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setSoon(false), 3500)
  }

  const showSwitch = lang !== 'it'
  return (
    <div>
      {showSwitch && (
        <div className="mb-2.5 flex justify-end">
          <div role="radiogroup" aria-label={t(lang, 'translate')} className="inline-flex h-7 items-center rounded-[8px] border border-stradeo-line bg-stradeo-bg p-0.5 text-[12px]">
            {(['it', 'tr'] as const).map(m => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => choose(m)}
                className={`h-full rounded-[6px] px-2.5 font-semibold transition-colors ${mode === m ? 'bg-stradeo-ink text-stradeo-bg' : 'text-stradeo-inkdim hover:text-stradeo-ink'}`}>
                {m === 'it' ? 'Italiano' : LANGUAGES[lang]}
              </button>
            ))}
          </div>
        </div>
      )}
      <p key={mode} lang={mode === 'it' ? 'it' : lang} className={`${className} animate-fade-in`}>
        {mode === 'tr' && translation ? translation : question.q}
      </p>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${soon ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} aria-live="polite">
        <div className="overflow-hidden">
          <p className="mt-2.5 flex items-center gap-2 rounded-[8px] bg-stradeo-accent/[0.08] px-2.5 py-2 text-[12px] text-stradeo-ink">
            <IconRoadworks size={14} className="text-stradeo-brandorange shrink-0" />{t(lang, 'aiSoon')}
          </p>
        </div>
      </div>
    </div>
  )
}
