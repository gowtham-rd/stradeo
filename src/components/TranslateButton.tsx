'use client'
import { useId, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, LANG_PROMPT, t } from '@/lib/i18n'
import { aiPost, AI_ENABLED, AI_NOT_READY, AI_LIMIT } from '@/lib/api'
import { IconTranslate, IconRoadworks, IconChevronDown } from '@/components/icons'

// Sits at the bottom of a question card: a full-width toggle that opens the
// translation (or the "coming soon" note) inline, with a smooth height animation.
// Hidden when the learn-through language is Italian, the language of the questions.
export default function TranslateButton({ question }: { question: string; compact?: boolean }) {
  const { lang } = useLanguage()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [translation, setTranslation] = useState<string | null>(null)
  const [soon, setSoon] = useState(false)
  const [loading, setLoading] = useState(false)

  if (lang === 'it') return null

  const load = async () => {
    if (!AI_ENABLED) { setSoon(true); return }
    setLoading(true)
    try {
      const res = await aiPost('/api/translate', ({ question, language: LANG_PROMPT[lang] }))
      if (res.status === AI_NOT_READY) setSoon(true)
      else if (res.status === AI_LIMIT) setTranslation(t(lang, 'aiLimit'))
      else if (!res.ok) throw new Error('translate failed')
      else setTranslation((await res.json()).translation || question)
    } catch { setTranslation(t(lang, 'translateFailed')) }
    setLoading(false)
  }

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && !translation && !soon && !loading) void load()
  }

  return (
    <div className="mt-4 border-t border-stradeo-line pt-3">
      <button type="button" onClick={toggle} aria-expanded={open} aria-controls={panelId}
        className="flex w-full items-center gap-2 rounded-[8px] py-1 text-[13px] font-semibold text-stradeo-blue active:scale-100">
        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-stradeo-blue/10">
          {loading
            ? <span className="w-3 h-3 border-[1.5px] border-stradeo-blue/30 border-t-stradeo-blue rounded-full animate-spin-slow" />
            : <IconTranslate size={14} />}
        </span>
        <span>{t(lang, 'translate')} · {LANGUAGES[lang]}</span>
        <IconChevronDown size={14} className={`ml-auto text-stradeo-inkfaint transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={panelId} role="region"
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="pt-2.5">
            {soon ? (
              <div className="flex items-start gap-3 rounded-[10px] border border-stradeo-accent/25 bg-stradeo-accent/[0.07] p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-stradeo-brandorange/15 text-stradeo-brandorange">
                  <IconRoadworks size={17} />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-stradeo-brandorange">{t(lang, 'comingSoon')}</div>
                  <p className="text-[13px] leading-snug text-stradeo-ink mt-0.5">{t(lang, 'aiSoon')}</p>
                </div>
              </div>
            ) : translation ? (
              <p className="rounded-[10px] bg-stradeo-blue/[0.06] p-3 text-[15px] leading-relaxed text-stradeo-ink">{translation}</p>
            ) : (
              <div className="h-12 rounded-[10px] bg-stradeo-surface2 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
