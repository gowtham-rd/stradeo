'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import StradeoMark from '@/components/StradeoMark'
import { IconCheck } from '@/components/icons'
import Busy from '@/components/Busy'

// Read the link's parameters as early as possible: the Supabase client removes the
// token from the address bar once it has used it.
const INITIAL_URL = typeof window !== 'undefined' ? window.location.hash.slice(1) + '&' + window.location.search.slice(1) : ''

// Landing page for the "reset password" email link. Supabase reads the recovery
// token from the URL and signs the user in; here they choose a new password.
export default function ResetPasswordPage() {
  const { lang } = useLanguage()
  const router = useRouter()
  const [state, setState] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // An expired or reused link comes back with an error in the URL.
    const params = new URLSearchParams(INITIAL_URL + '&' + window.location.hash.slice(1) + '&' + window.location.search.slice(1))
    if (params.get('error') || params.get('error_code')) { setState('invalid'); return }

    let settled = false
    const ready = () => { if (!settled) { settled = true; setState('ready') } }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) ready()
    })
    supabase.auth.getSession().then(({ data }) => {
      // Signed in by the link (or already signed in): let them set a new password.
      if (data.session) ready()
    })
    // No usable token after a few seconds: treat the link as invalid.
    const timer = setTimeout(() => { if (!settled) { settled = true; setState('invalid') } }, 6000)
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
    setState('done')
    // Clear the token from the address bar, then go home.
    window.history.replaceState(null, '', '/reset')
    setTimeout(() => router.replace('/'), 1600)
  }

  const field = 'w-full px-4 py-3 rounded-lg border border-stradeo-line bg-stradeo-bg text-stradeo-ink text-[15px] outline-none focus:border-stradeo-ink'
  return (
    <div className="screen"><div className="screen-inner animate-fade-in-up">
      <div className="w-full max-w-[380px]">
        <div className="flex justify-center mb-8"><StradeoMark size={56} /></div>
        <div className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-6">
          {state === 'checking' && <p className="text-[14px] text-stradeo-inkdim" role="status">{t(lang, 'pwChecking')}</p>}

          {state === 'invalid' && (
            <>
              <h1 className="text-lg font-bold mb-2">{t(lang, 'pwResetTitle')}</h1>
              <p className="text-[14px] leading-relaxed text-stradeo-ink mb-5">{t(lang, 'pwLinkInvalid')}</p>
              <a href="/login" className="block w-full py-3.5 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-center text-base font-bold">{t(lang, 'pwBack')}</a>
            </>
          )}

          {state === 'ready' && (
            <form onSubmit={save}>
              <h1 className="text-lg font-bold mb-5">{t(lang, 'pwNewTitle')}</h1>
              <label htmlFor="new-pw" className="block text-xs font-semibold text-stradeo-inkdim uppercase tracking-wider mb-1.5">{t(lang, 'pwNew')}</label>
              <input id="new-pw" type="password" autoComplete="new-password" required minLength={8} autoFocus value={pw} onChange={e => setPw(e.target.value)} className={`${field} mb-4`} />
              <label htmlFor="new-pw2" className="block text-xs font-semibold text-stradeo-inkdim uppercase tracking-wider mb-1.5">{t(lang, 'pwConfirm')}</label>
              <input id="new-pw2" type="password" autoComplete="new-password" required minLength={8} value={pw2} onChange={e => setPw2(e.target.value)} className={`${field} mb-4`} />
              <p className="-mt-2 mb-4 text-[12px] text-stradeo-inkfaint">{t(lang, 'pwTooShort')}</p>
              {error && <div className="bg-stradeo-accent2/10 rounded-lg px-3.5 py-2.5 mb-4 text-[13px] text-stradeo-accent2">{error}</div>}
              <button type="submit" disabled={saving} className={`w-full py-3.5 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-base font-bold ${saving ? '' : 'disabled:opacity-50'}`}>
                <Busy busy={saving}>{t(lang, 'pwSave')}</Busy>
              </button>
            </form>
          )}

          {state === 'done' && (
            <p className="flex items-center gap-2 text-[14px] font-semibold text-stradeo-green" role="status"><IconCheck size={14} />{t(lang, 'pwSaved')}</p>
          )}
        </div>
      </div>
    </div></div>
  )
}
