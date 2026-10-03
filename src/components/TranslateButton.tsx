'use client'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, LANG_PROMPT, t } from '@/lib/i18n'
import { aiPost, AI_NOT_READY } from '@/lib/api'
import { IconTranslate, IconRoadworks } from '@/components/icons'

interface Props {
  question: string
  compact?: boolean
}

export default function TranslateButton({ question, compact }: Props) {
  const { lang } = useLanguage()
  const [translation, setTranslation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const translate = async () => {
    if (lang === 'it') { setTranslation(question); return }
    setLoading(true)
    try {
      const res = await aiPost('/api/translate', ({ question, language: LANG_PROMPT[lang] }))
      if (res.status === AI_NOT_READY) { setTranslation(t(lang, 'aiSoon')); setLoading(false); return }
      if (!res.ok) throw new Error('translate failed')
      const data = await res.json()
      setTranslation(data.translation || question)
    } catch { setTranslation(t(lang, 'translateFailed')) }
    setLoading(false)
  }

  return (
    <>
      <button onClick={translate} disabled={loading} aria-label={`${t(lang, 'translate')}: ${LANGUAGES[lang]}`}
        className={`flex items-center gap-1 rounded border border-stradeo-blue/20 bg-stradeo-blue/[0.06] text-stradeo-blue font-semibold ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
        }`}>
        {loading ? <div className="w-2.5 h-2.5 border-[1.5px] border-stradeo-blue/30 border-t-stradeo-blue rounded-full animate-spin-slow" /> : <><IconTranslate size={compact ? 11 : 12} />{compact ? '' : LANGUAGES[lang]}</>}
      </button>
      {translation && (
        <p className="basis-full w-full text-left text-sm leading-relaxed text-stradeo-blue italic border-t border-stradeo-blue/10 pt-2.5 mt-2.5">
          {translation === t(lang, 'aiSoon')
            ? <span className="not-italic inline-flex items-start gap-2 text-stradeo-inkdim"><IconRoadworks size={16} className="text-stradeo-brandorange mt-0.5" />{translation}</span>
            : translation}
        </p>
      )}
    </>
  )
}
