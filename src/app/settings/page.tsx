'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { LANGUAGES, LANG_ENABLED, t, type UIKey } from '@/lib/i18n'
import type { Language } from '@/types'
import NavBar from '@/components/NavBar'
import ThemeToggle from '@/components/ThemeToggle'
import HashtagMark from '@/components/HashtagMark'
import TextSizeSlider from '@/components/TextSizeSlider'
import { localDay } from '@/lib/plan'
import { toast } from '@/lib/toast'
import { IconCalendar, IconSettings, IconCheck, IconArrowRight, IconWarning, IconRoadworks, IconTranslate } from '@/components/icons'

const DATE_LOCALE: Record<Language, string> = { en: 'en-GB', it: 'it-IT', ta: 'ta-IN', hi: 'hi-IN' }

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { lang, setLang } = useLanguage()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-[640px] mx-auto px-4 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] stagger">
        <h1 className="text-[22px] font-bold mb-5 inline-flex items-center gap-2.5"><IconSettings size={20} />{t(lang, 'settings')}</h1>

        {/* Name + Appearance: side by side on wider screens, stacked on phones */}
        <div className="grid gap-3.5 sm:grid-cols-2 mb-3.5">
          <Section title={t(lang, 'yourName')} flush><NameEditor /></Section>
          <Section title={t(lang, 'appearance')} flush>
            <ThemeToggle />
            <p className="text-[12px] text-stradeo-inkfaint mt-2.5">{t(lang, 'themeHint')}</p>
            <div className="mt-4 pt-4 border-t border-stradeo-line"><TextSizeSlider /></div>
          </Section>
        </div>

        <div id="exam-date" className="scroll-mt-20">
          <Section title={t(lang, 'examDate')}><ExamDateEditor /></Section>
        </div>

        <Section title={t(lang, 'learnThrough')}>
          <div role="radiogroup" aria-label={t(lang, 'learnThrough')} className="grid grid-cols-2 gap-2">
            {(Object.entries(LANGUAGES) as [Language, string][]).map(([k, name]) => (
              <button key={k} role="radio" aria-checked={lang === k} disabled={!LANG_ENABLED[k]}
                onClick={() => { if (k !== lang) { setLang(k); toast({ tone: 'ok', title: t(k, 'langChanged'), note: name }) } }}
                className={`flex items-center justify-between rounded-[10px] border px-3.5 py-3 text-sm font-semibold text-left disabled:cursor-not-allowed disabled:opacity-45 disabled:border-dashed ${
                  lang === k ? 'border-stradeo-ink text-stradeo-ink' : 'border-stradeo-line text-stradeo-inkdim enabled:hover:text-stradeo-ink'
                }`}>
                <span className="flex flex-col leading-tight">
                  {name}
                  {!LANG_ENABLED[k] && <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[1px] text-stradeo-inkfaint">{t(lang, 'soonShort')}</span>}
                </span>
                {lang === k && <IconCheck size={14} />}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-stradeo-inkfaint mt-2.5">{t(lang, 'learnThroughHint')}</p>
        </Section>

        <Section title={t(lang, 'account')}>
          <p className="text-[13px] text-stradeo-inkdim mb-3">
            {t(lang, 'signedInAs')} <strong className="font-semibold text-stradeo-ink break-all">{user?.email}</strong>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button onClick={signOut}
              className="rounded-[10px] border border-stradeo-line px-4 py-3 text-sm font-semibold text-stradeo-ink hover:border-stradeo-ink">
              {t(lang, 'logout')}
            </button>
            <button onClick={() => setConfirmReset(true)}
              className="rounded-[10px] border border-stradeo-line px-4 py-3 text-sm font-semibold text-stradeo-accent2 hover:border-stradeo-accent2">
              {t(lang, 'resetProgress')}
            </button>
          </div>
        </Section>

        <Section title={t(lang, 'about')}>
          <h3 className="text-[13px] font-bold text-stradeo-ink mb-2 inline-flex items-center gap-2">
            <IconRoadworks size={15} className="text-stradeo-brandorange" />{t(lang, 'comingSoon')}
          </h3>
          <ul className="space-y-2.5 mb-4">
            <Upcoming icon={<IconTranslate size={14} />} title="soonTaHiTitle" body="soonTaHiBody" />
          </ul>
          <Link href="/privacy" className="flex items-center justify-between rounded-[10px] border border-stradeo-line px-4 py-3 text-sm font-semibold text-stradeo-ink hover:border-stradeo-ink">
            {t(lang, 'privacyLink')} <IconArrowRight size={13} />
          </Link>
          <a href="https://quattroventi.xyz" target="_blank" rel="noopener"
            className="mt-2 flex items-center gap-3 rounded-[10px] border border-stradeo-line px-4 py-3 hover:border-stradeo-ink">
            <HashtagMark size={36} />
            <span className="flex-1 min-w-0 text-sm font-bold text-stradeo-ink">Hashtag Labs</span>
            <IconArrowRight size={13} />
          </a>
          <p className="font-mono text-[12px] text-stradeo-inkfaint mt-3">
            Stradeo · {t(lang, 'appVersion')} {process.env.NEXT_PUBLIC_APP_VERSION} · {t(lang, 'updatedOn')} {new Date(process.env.NEXT_PUBLIC_BUILD_DATE || Date.now()).toLocaleDateString(DATE_LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </Section>
      </main>

      {confirmReset && <ResetDialog onClose={() => setConfirmReset(false)} />}
    </div>
  )
}

function Section({ title, children, flush }: { title: string; children: React.ReactNode; flush?: boolean }) {
  return (
    <section className={`bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-5 ${flush ? '' : 'mb-3.5'}`}>
      <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-stradeo-inkdim mb-3">{title}</h2>
      {children}
    </section>
  )
}

function Upcoming({ icon, title, body }: { icon: React.ReactNode; title: UIKey; body: UIKey }) {
  const { lang } = useLanguage()
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 text-stradeo-inkdim">{icon}</span>
      <span>
        <span className="block text-[13px] font-semibold text-stradeo-ink">{t(lang, title)}</span>
        <span className="block text-[12px] leading-snug text-stradeo-inkdim">{t(lang, body)}</span>
      </span>
    </li>
  )
}

function NameEditor() {
  const { user, updateName } = useAuth()
  const { lang } = useLanguage()
  // Show the name actually in use (saved name, or the start of the email) as real text, not a placeholder.
  const current = user?.name || user?.email?.split('@')[0] || ''
  const [value, setValue] = useState(current)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  useEffect(() => { setValue(current) }, [current])
  const dirty = value.trim() !== current && value.trim().length > 0

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!dirty) return
    setState('saving')
    const { error } = await updateName(value)
    setState(error ? 'error' : 'saved')
    if (error) toast({ tone: 'error', title: t(lang, 'saveFailedTitle'), note: t(lang, 'saveFailedNote') })
    else { toast({ tone: 'ok', title: t(lang, 'nameSaved'), note: value.trim() }); (document.activeElement as HTMLElement | null)?.blur() }
  }

  return (
    <form onSubmit={save}>
      <label htmlFor="display-name" className="sr-only">{t(lang, 'yourName')}</label>
      <div className="flex gap-2">
        <input id="display-name" value={value} maxLength={40} autoComplete="nickname"
          onChange={e => { setValue(e.target.value); setState('idle') }} enterKeyHint="done"
          className="min-w-0 flex-1 h-8 px-3 rounded-lg border border-stradeo-line bg-stradeo-bg text-stradeo-ink text-sm outline-none focus:border-stradeo-ink" />
        <button type="submit" disabled={!dirty || state === 'saving'}
          className="h-8 px-3 rounded-lg bg-stradeo-ink text-stradeo-bg text-[13px] font-semibold disabled:bg-stradeo-surface2 disabled:text-stradeo-inkfaint">
          {t(lang, 'save')}
        </button>
      </div>
      <p className="text-[12px] mt-2.5 text-stradeo-inkfaint">
        {t(lang, 'nameHint')}
      </p>
    </form>
  )
}

function ExamDateEditor() {
  const { user, updateProfile } = useAuth()
  const { lang } = useLanguage()
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const value = user?.examDate || ''

  async function save(next: string | null) {
    setState('saving')
    const { error } = await updateProfile({ examDate: next })
    setState(error ? 'error' : 'saved')
    if (error) toast({ tone: 'error', title: t(lang, 'saveFailedTitle'), note: t(lang, 'saveFailedNote') })
    else if (next) toast({ tone: 'ok', title: t(lang, 'examDateSaved'), note: new Date(next + 'T12:00').toLocaleDateString(DATE_LOCALE[lang], { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) })
    else toast({ tone: 'ok', title: t(lang, 'examDateCleared') })
  }

  return (
    <div>
      <div className="flex gap-2">
        <label className="flex-1 min-w-0 flex items-center gap-2.5 h-10 px-3 rounded-lg border border-stradeo-line bg-stradeo-bg focus-within:border-stradeo-ink">
          <IconCalendar size={15} className="text-stradeo-blue shrink-0" />
          <span className="sr-only">{t(lang, 'examDate')}</span>
          <input type="date" value={value} min={localDay()} onChange={e => save(e.target.value || null)}
            className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-stradeo-ink outline-none" />
        </label>
        {value && (
          <button type="button" onClick={() => save(null)} disabled={state === 'saving'}
            className="h-10 px-3 rounded-lg border border-stradeo-line text-[13px] font-semibold text-stradeo-inkdim hover:text-stradeo-ink">
            {t(lang, 'clear')}
          </button>
        )}
      </div>
      <p className="text-[12px] mt-2.5 text-stradeo-inkfaint">
        {t(lang, 'examDateHint')}
      </p>
    </div>
  )
}

function ResetDialog({ onClose }: { onClose: () => void }) {
  const { lang } = useLanguage()
  const { resetProgress } = useProgress()
  const { updateProfile } = useAuth()
  const router = useRouter()
  const [typed, setTyped] = useState('')
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const word = t(lang, 'resetWord')
  const ok = typed.trim().toUpperCase() === word.toUpperCase()

  // A full fresh start: progress, exam date and on-device study state go, and the
  // app opens on the welcome/setup screens again. Theme, text size and language stay.
  async function confirm() {
    setState('working')
    if (!(await resetProgress())) { setState('error'); return }
    const { error } = await updateProfile({ onboarded: false, examDate: null })
    if (error) { setState('error'); return }
    try { ['stradeo-last-topic', 'stradeo-milestones'].forEach(k => localStorage.removeItem(k)) } catch { /* storage blocked */ }
    toast({ tone: 'ok', title: t(lang, 'resetDone'), note: t(lang, 'resetDoneBody') })
    router.replace('/')
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="reset-title"
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/40 p-4 animate-backdrop-in"
      onKeyDown={e => { if (e.key === 'Escape' && state !== 'working') onClose() }}>
      <div className="w-full max-w-[420px] rounded-[14px] concentric-b border border-stradeo-line bg-stradeo-bg2 p-5 pb-[max(20px,env(safe-area-inset-bottom))] animate-sheet-up">
        {state === 'done' ? (
          <>
            <h2 id="reset-title" className="text-lg font-bold mb-1 inline-flex items-center gap-2"><IconCheck size={16} className="text-stradeo-green" />{t(lang, 'resetDone')}</h2>
            <p className="text-sm text-stradeo-inkdim mb-5">{t(lang, 'resetDoneBody')}</p>
            <Link href="/" className="block w-full py-3 rounded-[10px] bg-stradeo-ink text-stradeo-bg font-semibold text-center">{t(lang, 'home')}</Link>
          </>
        ) : (
          <>
            <h2 id="reset-title" className="text-lg font-bold mb-1 inline-flex items-center gap-2"><IconWarning size={16} className="text-stradeo-accent2" />{t(lang, 'resetTitle')}</h2>
            <p className="text-sm text-stradeo-inkdim mb-4">{t(lang, 'resetBody')}</p>
            <label htmlFor="reset-confirm" className="block text-[12px] font-semibold text-stradeo-inkdim mb-1.5">
              {t(lang, 'resetType')} <span className="font-mono text-stradeo-ink">{word}</span>
            </label>
            <input id="reset-confirm" value={typed} onChange={e => setTyped(e.target.value)} autoFocus autoComplete="off"
              className="w-full h-10 px-3 rounded-lg border border-stradeo-line bg-stradeo-bg text-stradeo-ink font-mono text-sm outline-none focus:border-stradeo-ink mb-4" />
            {state === 'error' && <p className="text-[12px] text-stradeo-accent2 mb-3">{t(lang, 'connError')}</p>}
            <div className="flex gap-2.5">
              <button onClick={onClose} disabled={state === 'working'} className="flex-1 py-3 rounded-[10px] border border-stradeo-line text-stradeo-inkdim font-semibold">{t(lang, 'cancel')}</button>
              <button onClick={confirm} disabled={!ok || state === 'working'}
                className="flex-1 py-3 rounded-[10px] bg-stradeo-accent2 text-white font-semibold disabled:opacity-40">
                {t(lang, 'resetConfirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
