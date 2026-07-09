'use client'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, LANG_PROMPT } from '@/lib/i18n'

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
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language: LANG_PROMPT[lang] }),
      })
      const data = await res.json()
      setTranslation(data.translation || question)
    } catch { setTranslation('Translation failed.') }
    setLoading(false)
  }

  return (
    <>
      <button onClick={translate} disabled={loading}
        className={`flex items-center gap-1 rounded border border-indigo-400/20 bg-indigo-400/[0.06] text-stradeo-blue font-semibold ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
        }`}>
        {loading ? <div className="w-2.5 h-2.5 border-[1.5px] border-indigo-400/30 border-t-stradeo-blue rounded-full animate-spin-slow" /> : <>🌐 {compact ? '' : LANGUAGES[lang]}</>}
      </button>
      {translation && (
        <p className="text-sm leading-relaxed text-stradeo-blue italic border-t border-indigo-400/10 pt-2.5 mt-2.5">
          {translation}
        </p>
      )}
    </>
  )
}
