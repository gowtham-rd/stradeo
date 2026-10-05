'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, t } from '@/lib/i18n'
import { localDay } from '@/lib/plan'
import type { Language } from '@/types'
import StradeoMark from './StradeoMark'
import { IconCalendar, IconCheck, IconChevronLeft, IconArrowRight, IconCross, IconExam, IconReview, IconStack, IconTimer, IconTip, IconTopics } from './icons'
import { TOTAL_QUESTIONS } from '@/lib/questionCounts'
import { EXAM_DURATION, EXAM_QUESTIONS, MAX_ERRORS } from '@/lib/constants'

const STEPS = 5 // two info screens, then name, language, exam date

// English name under each language, so it's recognisable whatever the UI language.
const LANG_SUB: Record<Language, string> = { en: 'English', it: 'Italian', ta: 'Tamil', hi: 'Hindi' }

/** First-time setup: name → learn-through language → exam date. Saved to the account. */
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { user, updateProfile } = useAuth()
  const { lang, setLang } = useLanguage()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  // Suggest a name from the email ("luca.rossi@…" → "Luca"), capitalised.
  const fromEmail = (user?.email?.split('@')[0] || '').split(/[._\-+0-9]/)[0]
  const [name, setName] = useState(user?.name || (fromEmail ? fromEmail[0].toUpperCase() + fromEmail.slice(1) : ''))
  const [date, setDate] = useState(user?.examDate || '')
  const [unknown, setUnknown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n) }

  async function finish(skipped = false) {
    setSaving(true); setError(false)
    const { error } = await updateProfile(skipped
      ? { onboarded: true }
      : { name: name.trim() || undefined, examDate: unknown || !date ? null : date, onboarded: true })
    setSaving(false)
    // Skipping never blocks the app, even offline.
    if (error && !skipped) { setError(true); return }
    onDone()
  }

  const canContinue = step === 2 ? name.trim().length > 0 : step === 4 ? unknown || !!date : true
  const last = step === STEPS - 1

  return (
    <div className="screen"><div className="flex flex-col max-w-[480px] mx-auto px-5 pt-[max(14px,env(safe-area-inset-top))] pb-[calc(84px+env(safe-area-inset-bottom))]">
      {/* Header: mark, progress, skip */}
      <div className="flex items-center gap-3">
        <StradeoMark size={32} />
        <div className="flex-1 flex gap-1.5" aria-label={t(lang, 'setupStep').replace('{n}', String(step + 1)).replace('{total}', String(STEPS))}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-stradeo-ink' : 'bg-stradeo-surface2'}`} />
          ))}
        </div>
        <button onClick={() => finish(true)} disabled={saving}
          className="h-9 px-3 rounded-[10px] text-sm font-semibold text-stradeo-inkdim hover:text-stradeo-ink">{t(lang, 'skip')}</button>
      </div>

      {/* Step */}
      <div className="pt-5 short:pt-3">
        <div className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim">
          {t(lang, 'setupWelcome')} · {t(lang, 'setupStep').replace('{n}', String(step + 1)).replace('{total}', String(STEPS))}
        </div>
        <div key={step} className={dir > 0 ? 'animate-slide-from-right' : 'animate-slide-from-left'}>
          {step === 0 && (
            <>
              <h1 className="text-[23px] leading-tight font-bold tracking-tight mt-1.5">{t(lang, 'introTitle')}</h1>
              <div className="mt-4 short:mt-3 grid gap-2.5 stagger">
                <Fact icon={<IconStack size={22} />} tone="text-stradeo-blue bg-stradeo-blue/10" value={TOTAL_QUESTIONS.toLocaleString(lang)} label={t(lang, 'introQuestions')} />
                <Fact icon={<IconTopics size={22} />} tone="text-stradeo-brandorange bg-stradeo-brandorange/10" value="25" label={t(lang, 'introTopics')} />
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2.5 stagger">
                {([[IconExam, 'examSim', 'text-stradeo-ink bg-stradeo-surface2'], [IconTip, 'readinessCard', 'text-stradeo-green bg-stradeo-green/10'], [IconReview, 'smartReview', 'text-stradeo-blue bg-stradeo-blue/10']] as const).map(([I, key, tone]) => (
                  <div key={key} className="flex flex-col items-center gap-2 rounded-[14px] border border-stradeo-line bg-stradeo-bg2 px-2 py-2.5 text-center">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${tone}`}><I size={18} /></span>
                    <span className="text-[12px] font-semibold leading-tight">{t(lang, key)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-[23px] leading-tight font-bold tracking-tight mt-1.5">{t(lang, 'examTitle')}</h1>
              <div className="mt-4 grid grid-cols-3 gap-2.5 stagger">
                <Tile icon={<IconExam size={20} />} tone="text-stradeo-ink bg-stradeo-surface2" value={String(EXAM_QUESTIONS)} label={t(lang, 'examQuestions')} />
                <Tile icon={<IconTimer size={20} />} tone="text-stradeo-blue bg-stradeo-blue/10" value={String(EXAM_DURATION / 60)} label={t(lang, 'examMinutes')} />
                <Tile icon={<IconCross size={16} />} tone="text-stradeo-accent2 bg-stradeo-accent2/10" value={String(MAX_ERRORS)} label={t(lang, 'examErrors')} />
              </div>
              {/* What answering looks like: the exam's own VERO / FALSO buttons */}
              <div className="mt-3 rounded-[14px] border border-stradeo-line bg-stradeo-bg2 p-3.5">
                <p className="text-[14px] leading-snug text-stradeo-ink">{t(lang, 'examAnswer')}</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5" aria-hidden="true">
                  <span className="flex h-12 items-center justify-center gap-2 rounded-[10px] border border-stradeo-green/40 bg-stradeo-green/10 text-[15px] font-bold tracking-[1px] text-stradeo-green"><IconCheck size={14} />VERO</span>
                  <span className="flex h-12 items-center justify-center gap-2 rounded-[10px] border border-stradeo-accent2/40 bg-stradeo-accent2/10 text-[15px] font-bold tracking-[1px] text-stradeo-accent2"><IconCross size={12} />FALSO</span>
                </div>
              </div>
              <p className="mt-3 short:mt-2 text-[13px] leading-snug text-stradeo-inkdim">{t(lang, 'examItalian')}</p>
            </>
          )}

          {step === 2 && (
            <form onSubmit={e => { e.preventDefault(); if (canContinue) go(3) }}>
              <h1 className="text-[23px] leading-tight font-bold tracking-tight mt-1.5">{t(lang, 'setupNameTitle')}</h1>
              <p className="text-[14px] text-stradeo-inkdim mt-2">{t(lang, 'setupNameHint')}</p>
              <input value={name} onChange={e => setName(e.target.value)} maxLength={40} autoComplete="nickname" enterKeyHint="next"
                aria-label={t(lang, 'yourName')}
                className="mt-4 w-full h-14 px-4 rounded-[12px] border border-stradeo-line bg-stradeo-bg2 text-[18px] font-semibold outline-none focus:border-stradeo-ink" />
            </form>
          )}

          {step === 3 && (
            <>
              <h1 className="text-[23px] leading-tight font-bold tracking-tight mt-1.5">{t(lang, 'setupLangTitle')}</h1>
              <p className="text-[14px] text-stradeo-inkdim mt-2">{t(lang, 'setupLangHint')}</p>
              <div role="radiogroup" aria-label={t(lang, 'learnThrough')} className="mt-4 grid grid-cols-2 gap-2.5">
                {(Object.entries(LANGUAGES) as [Language, string][]).map(([k, label]) => (
                  <button key={k} role="radio" aria-checked={lang === k} onClick={() => setLang(k)}
                    className={`relative flex flex-col items-start gap-0.5 rounded-[12px] border p-4 text-left transition-colors ${
                      lang === k ? 'border-stradeo-ink bg-stradeo-bg2' : 'border-stradeo-line hover:border-stradeo-inkfaint'}`}>
                    <span className="text-[17px] font-bold">{label}</span>
                    <span className="text-[12px] text-stradeo-inkdim">{LANG_SUB[k]}</span>
                    {lang === k && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-stradeo-ink text-stradeo-bg"><IconCheck size={11} /></span>}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-[23px] leading-tight font-bold tracking-tight mt-1.5">{t(lang, 'setupDateTitle')}</h1>
              <p className="text-[14px] text-stradeo-inkdim mt-2">{t(lang, 'setupDateHint')}</p>
              <label className={`mt-4 flex items-center gap-3 h-14 px-4 rounded-[12px] border bg-stradeo-bg2 transition-opacity ${unknown ? 'opacity-40 border-stradeo-line' : date ? 'border-stradeo-ink' : 'border-stradeo-line'}`}>
                <IconCalendar size={18} className="text-stradeo-blue shrink-0" />
                <span className="sr-only">{t(lang, 'examDate')}</span>
                <input type="date" value={date} min={localDay()} disabled={unknown}
                  onChange={e => setDate(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-[17px] font-semibold outline-none text-stradeo-ink" />
              </label>
              <button type="button" onClick={() => setUnknown(u => !u)} aria-pressed={unknown}
                className={`mt-3 w-full h-12 rounded-[12px] border text-[15px] font-semibold inline-flex items-center justify-center gap-2 ${
                  unknown ? 'border-stradeo-ink bg-stradeo-bg2 text-stradeo-ink' : 'border-stradeo-line text-stradeo-inkdim hover:text-stradeo-ink'}`}>
                {unknown && <IconCheck size={13} />}{t(lang, 'dontKnowYet')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Back / Continue: pinned to the bottom of the screen (portalled to <body> so the
          page's enter animation can't move it) */}
      {mounted && createPortal(
      <div className="fixed inset-x-0 bottom-0 z-30 bg-stradeo-bg/95 backdrop-blur-[12px]">
      <div className="max-w-[480px] mx-auto px-5 pt-2.5 pb-[max(14px,env(safe-area-inset-bottom))]">
      {error && <p role="alert" className="mb-3 text-[13px] text-stradeo-accent2">{t(lang, 'setupSaveFailed')}</p>}
      <div className="flex gap-2.5">
        {step > 0 && (
          <button onClick={() => go(step - 1)} disabled={saving} aria-label={t(lang, 'back')}
            className="h-12 px-4 rounded-[12px] concentric-bl border border-stradeo-line text-stradeo-ink font-semibold inline-flex items-center gap-1.5">
            <IconChevronLeft size={14} />{t(lang, 'back')}
          </button>
        )}
        <button onClick={() => (last ? finish() : go(step + 1))} disabled={!canContinue || saving}
          className={`flex-1 h-12 rounded-[12px] concentric-br ${step === 0 ? 'concentric-bl' : ''} bg-stradeo-brand text-stradeo-onbrand text-[16px] font-bold inline-flex items-center justify-center gap-2 disabled:bg-stradeo-surface2 disabled:text-stradeo-inkfaint`}>
          {saving ? <span className="w-4 h-4 border-2 border-stradeo-onbrand/30 border-t-stradeo-onbrand rounded-full animate-spin-slow" />
            : <>{t(lang, last ? 'letsGo' : 'continueBtn')}<IconArrowRight size={15} /></>}
        </button>
      </div>
      </div>
      </div>, document.body)}
    </div></div>
  )
}

function Fact({ icon, tone, value, label }: { icon: React.ReactNode; tone: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[14px] border border-stradeo-line bg-stradeo-bg2 px-4 py-3 short:py-2">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${tone}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block font-mono text-[25px] leading-none tracking-tight">{value}</span>
        <span className="block mt-1 text-[13px] leading-snug text-stradeo-inkdim">{label}</span>
      </span>
    </div>
  )
}

function Tile({ icon, tone, value, label }: { icon: React.ReactNode; tone: string; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] border border-stradeo-line bg-stradeo-bg2 px-2 py-3 short:py-2 text-center">
      <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${tone}`}>{icon}</span>
      <span className="mt-2 font-mono text-[24px] leading-none">{value}</span>
      <span className="mt-1.5 text-[11px] leading-tight text-stradeo-inkdim">{label}</span>
    </div>
  )
}
