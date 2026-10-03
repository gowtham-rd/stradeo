'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { t, type UIKey } from '@/lib/i18n'
import { questionKey } from '@/lib/questions'
import type { Question } from '@/types'
import { IconWarning, IconCheck } from './icons'

const REASONS: { value: string; key: UIKey }[] = [
  { value: 'wrong_answer', key: 'reportWrongAnswer' },
  { value: 'bad_translation', key: 'reportTranslation' },
  { value: 'image', key: 'reportImage' },
  { value: 'unclear', key: 'reportUnclear' },
  { value: 'other', key: 'reportOther' },
]

// "Report a problem" with a question: wrong official answer, bad translation, missing image…
// Saved to the question_reports table for the admin to review.
export default function ReportQuestion({ question }: { question: Question }) {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  if (!user) return null
  if (state === 'sent') {
    return <p className="flex items-center justify-center gap-1.5 text-[12px] text-stradeo-inkdim mt-3"><IconCheck size={12} />{t(lang, 'reportThanks')}</p>
  }
  if (!open) {
    return (
      <div className="flex justify-center mt-3">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-[12px] text-stradeo-inkfaint hover:text-stradeo-ink">
          <IconWarning size={12} />{t(lang, 'reportProblem')}
        </button>
      </div>
    )
  }

  async function send() {
    if (!reason || !user) return
    setState('sending')
    const { error } = await supabase.from('question_reports').insert({
      user_id: user.id,
      question_key: questionKey(question),
      reason,
      note: note.trim().slice(0, 500) || null,
    })
    setState(error ? 'error' : 'sent')
  }

  return (
    <div className="mt-3 rounded-[10px] border border-stradeo-line bg-stradeo-bg2 p-3.5 text-left">
      <p className="text-[12px] font-semibold text-stradeo-inkdim uppercase tracking-[1px] mb-2.5">{t(lang, 'reportProblem')}</p>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {REASONS.map(r => (
          <button key={r.value} onClick={() => setReason(r.value)} aria-pressed={reason === r.value}
            className={`px-2.5 py-1 rounded-md border text-[12px] font-semibold ${reason === r.value ? 'border-stradeo-ink bg-stradeo-ink text-stradeo-bg' : 'border-stradeo-line text-stradeo-inkdim hover:text-stradeo-ink'}`}>
            {t(lang, r.key)}
          </button>
        ))}
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2}
        aria-label={t(lang, 'reportNote')} placeholder={t(lang, 'reportNote')}
        className="w-full px-3 py-2 rounded-lg border border-stradeo-line bg-stradeo-bg text-stradeo-ink text-[13px] outline-none focus:border-stradeo-ink resize-none" />
      {state === 'error' && <p className="text-[12px] text-stradeo-accent2 mt-1.5">{t(lang, 'reportFailed')}</p>}
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-stradeo-inkdim hover:text-stradeo-ink">{t(lang, 'cancel')}</button>
        <button onClick={send} disabled={!reason || state === 'sending'}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-stradeo-ink text-stradeo-bg disabled:opacity-40">{t(lang, 'send')}</button>
      </div>
    </div>
  )
}
