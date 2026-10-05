'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, LANG_ENABLED, t } from '@/lib/i18n'
import { isStandalone } from '@/lib/authLink'
import type { Language } from '@/types'
import StradeoMark from '@/components/StradeoMark'
import InstallGuide from '@/components/InstallGuide'
import { IconCheck } from '@/components/icons'
import Busy from '@/components/Busy'

// Landing page for the invite email. Stradeo is invite-only: the link signs the
// new tester in, they choose a password, then add Stradeo to their Home Screen
// and log in there (an installed iPhone app doesn't share Safari's login).
export default function WelcomePage() {
  const { lang, setLang } = useLanguage()
  const router = useRouter()
  const [step, setStep] = useState<'checking' | 'password' | 'install' | 'invalid'>('checking')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let settled = false
    const ready = () => { if (!settled) { settled = true; setStep('password') } }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { if (session) ready() })
    supabase.auth.getSession().then(({ data }) => { if (data.session) ready() })
    const timer = setTimeout(() => { if (!settled) { settled = true; setStep('invalid') } }, 6000)
    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pw.length < 8) { setError(t(lang, 'pwTooShort')); return }
    if (pw !== pw2) { setError(t(lang, 'pwMismatch')); return }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password: pw })
    setSaving(false)
    if (err) { setError(/fetch|network/i.test(err.message) ? t(lang, 'connError') : err.message); return }
    window.history.replaceState(null, '', '/welcome')
    // Already inside the installed app: nothing to install, go straight in.
    if (isStandalone()) router.replace('/')
    else setStep('install')
  }

  const field = 'w-full px-4 py-2.5 rounded-lg border border-stradeo-line bg-stradeo-bg text-stradeo-ink text-[15px] outline-none focus:border-stradeo-ink'
  const label = 'block text-xs font-semibold text-stradeo-inkdim uppercase tracking-wider mb-1.5'
  return (
    <div className="screen"><div className="screen-inner animate-fade-in-up">
      <div className="w-full max-w-[400px]">
        <div className="mb-3 short:mb-2 flex items-center justify-center gap-3">
          <StradeoMark size={40} />
          <h1 className="text-[22px] font-bold tracking-tight leading-tight">{t(lang, 'welcomeTitle')}</h1>
        </div>
        {step !== 'install' && (
          <div className="flex justify-center gap-1.5 mb-4">
            {(Object.entries(LANGUAGES) as [Language, string][]).map(([k, name]) => (
              <button key={k} type="button" onClick={() => setLang(k)}
                disabled={!LANG_ENABLED[k]} title={LANG_ENABLED[k] ? undefined : t(lang, 'soonShort')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-35 disabled:cursor-not-allowed ${lang === k ? 'bg-stradeo-ink text-stradeo-bg' : 'border border-stradeo-line text-stradeo-inkdim enabled:hover:text-stradeo-ink'}`}>{name}</button>
            ))}
          </div>
        )}

        <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-4 roomy:p-5 short:p-3.5">
          {step === 'checking' && <p className="text-[14px] text-stradeo-inkdim" role="status">{t(lang, 'pwChecking')}</p>}

          {step === 'invalid' && (
            <>
              <p className="text-[14px] leading-relaxed text-stradeo-ink mb-4">{t(lang, 'welcomeInvalid')}</p>
              <a href="/login" className="block w-full py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-center text-base font-bold">{t(lang, 'pwBack')}</a>
            </>
          )}

          {step === 'password' && (
            <form onSubmit={save}>
              <Steps at={1} />
              <p className="text-[14px] leading-snug text-stradeo-ink mb-4">{t(lang, 'welcomeHint')}</p>
              <label htmlFor="w-pw" className={label}>{t(lang, 'pwNew')}</label>
              <input id="w-pw" type="password" autoComplete="new-password" required minLength={8} autoFocus value={pw} onChange={e => setPw(e.target.value)} className={`${field} mb-3`} />
              <label htmlFor="w-pw2" className={label}>{t(lang, 'pwConfirm')}</label>
              <input id="w-pw2" type="password" autoComplete="new-password" required minLength={8} value={pw2} onChange={e => setPw2(e.target.value)} className={`${field} mb-1.5`} />
              <p className="mb-3 text-[12px] text-stradeo-inkfaint">{t(lang, 'pwTooShort')}</p>
              {error && <div className="bg-stradeo-accent2/10 rounded-lg px-3.5 py-2 mb-3 text-[13px] text-stradeo-accent2">{error}</div>}
              <button type="submit" disabled={saving} className={`w-full py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-base font-bold ${saving ? '' : 'disabled:opacity-50'}`}>
                <Busy busy={saving}>{t(lang, 'pwSave')}</Busy>
              </button>
            </form>
          )}

          {step === 'install' && (
            <div className="animate-fade-in">
              <Steps at={2} />
              <p className="mb-1 flex short:hidden items-center gap-1.5 text-[12px] font-semibold text-stradeo-green"><IconCheck size={11} />{t(lang, 'pwChosen')}</p>
              <h2 className="text-[17px] short:text-[16px] font-bold leading-snug mb-2.5 roomy:mb-0"><span className="short:hidden">{t(lang, 'installTitle')}</span><span className="hidden short:inline">{t(lang, 'installTitleShort')}</span></h2>
              <p className="mt-1 mb-3 hidden roomy:block text-[12px] leading-snug text-stradeo-inkdim">{t(lang, 'installWhy')}</p>
              <InstallGuide compact />
              <p className="mt-2.5 short:mt-2 text-[13px] short:text-[12.5px] leading-snug text-stradeo-ink">{added ? t(lang, 'installOpenIcon') : t(lang, 'installThen')}</p>
              {!added && (
                <button type="button" onClick={() => setAdded(true)}
                  className="mt-3 short:mt-2 w-full py-3 short:py-2.5 rounded-[10px] bg-stradeo-ink text-stradeo-bg text-base font-bold">{t(lang, 'installDone')}</button>
              )}
              <button type="button" onClick={() => router.replace('/')}
                className="mt-2.5 w-full text-center text-[12px] font-semibold text-stradeo-inkdim underline hover:text-stradeo-ink">{t(lang, 'continueBrowser')}</button>
            </div>
          )}
        </div>
      </div>
    </div></div>
  )
}

function Steps({ at }: { at: 1 | 2 }) {
  return (
    <div className="mb-3 flex gap-1.5" aria-hidden="true">
      {[1, 2].map(n => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= at ? 'bg-stradeo-brandorange' : 'bg-stradeo-line'}`} />)}
    </div>
  )
}
