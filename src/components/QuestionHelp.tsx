'use client'
import { useId, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, LANG_PROMPT, t } from '@/lib/i18n'
import { aiPost, AI_ENABLED, AI_NOT_READY, AI_LIMIT } from '@/lib/api'
import type { Question } from '@/types'
import { IconTranslate, IconTip, IconRoadworks } from './icons'

type Tab = 'translate' | 'why'
type Content = { kind: 'text'; text: string } | { kind: 'soon' } | { kind: 'loading' }

// Under a question on the results page: "Translate" and "Why?" toggles that open
// one shared panel inline (smooth height). Until the built-in translations and
// explanations exist, each shows a clear "coming soon" note.
export default function QuestionHelp({ question, showWhy }: { question: Question; showWhy: boolean }) {
  const { lang } = useLanguage()
  const panelId = useId()
  const [open, setOpen] = useState<Tab | null>(null)
  const [content, setContent] = useState<Partial<Record<Tab, Content>>>({})
  const showTranslate = lang !== 'it'
  if (!showTranslate && !showWhy) return null

  const load = async (tab: Tab) => {
    if (content[tab]) return
    if (!AI_ENABLED) { setContent(c => ({ ...c, [tab]: { kind: 'soon' } })); return }
    setContent(c => ({ ...c, [tab]: { kind: 'loading' } }))
    try {
      const res = tab === 'translate'
        ? await aiPost('/api/translate', { question: question.q, language: LANG_PROMPT[lang] })
        : await aiPost('/api/explain', { question: question.q, correctAnswer: question.a, language: LANG_PROMPT[lang] })
      if (res.status === AI_NOT_READY) { setContent(c => ({ ...c, [tab]: { kind: 'soon' } })); return }
      if (res.status === AI_LIMIT) { setContent(c => ({ ...c, [tab]: { kind: 'text', text: t(lang, 'aiLimit') } })); return }
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      const text = tab === 'translate' ? data.translation : data.explanation
      setContent(c => ({ ...c, [tab]: { kind: 'text', text: text || t(lang, 'unavailable') } }))
    } catch {
      setContent(c => ({ ...c, [tab]: { kind: 'text', text: t(lang, 'unavailable') } }))
    }
  }

  const toggle = (tab: Tab) => {
    const next = open === tab ? null : tab
    setOpen(next)
    if (next) void load(next)
  }

  const shown = open ? content[open] : undefined

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {showTranslate && (
          <Chip active={open === 'translate'} onClick={() => toggle('translate')} controls={panelId}
            tone="text-stradeo-blue" activeTone="border-stradeo-blue/50 bg-stradeo-blue/10"
            icon={<IconTranslate size={13} />} label={`${t(lang, 'translate')} · ${LANGUAGES[lang]}`} />
        )}
        {showWhy && (
          <Chip active={open === 'why'} onClick={() => toggle('why')} controls={panelId}
            tone="text-stradeo-brandorange" activeTone="border-stradeo-brandorange/50 bg-stradeo-brandorange/10"
            icon={<IconTip size={13} />} label={t(lang, 'why')} />
        )}
      </div>
      <div id={panelId} role="region"
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="pt-2.5">
            {!shown || shown.kind === 'loading' ? (
              <div className="h-12 rounded-[10px] bg-stradeo-surface2 animate-pulse" />
            ) : shown.kind === 'soon' ? (
              <div className="flex items-start gap-3 rounded-[10px] border border-stradeo-accent/25 bg-stradeo-accent/[0.07] p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-stradeo-brandorange/15 text-stradeo-brandorange">
                  <IconRoadworks size={17} />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-stradeo-brandorange">{t(lang, 'comingSoon')}</div>
                  <p className="text-[13px] leading-snug text-stradeo-ink mt-0.5">{t(lang, open === 'why' ? 'explainSoon' : 'aiSoon')}</p>
                </div>
              </div>
            ) : (
              <p className={`rounded-[10px] p-3 text-[14px] leading-relaxed text-stradeo-ink ${open === 'why' ? 'bg-stradeo-brandorange/[0.07]' : 'bg-stradeo-blue/[0.06]'}`}>{shown.text}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ active, onClick, controls, tone, activeTone, icon, label }: {
  active: boolean; onClick: () => void; controls: string; tone: string; activeTone: string; icon: React.ReactNode; label: string
}) {
  return (
    <button type="button" onClick={onClick} aria-expanded={active} aria-controls={controls}
      className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] border px-2.5 text-[12px] font-semibold ${tone} ${active ? activeTone : 'border-stradeo-line hover:border-stradeo-inkfaint'}`}>
      {icon}{label}
    </button>
  )
}
