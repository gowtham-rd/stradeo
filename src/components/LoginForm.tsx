'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import StradeoMark from './StradeoMark'
import { LANGUAGES, t } from '@/lib/i18n'
import type { Language } from '@/types'

export default function LoginForm() {
  const { signIn } = useAuth()
  const { lang, setLang } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email, password)
    if (err) setError(t(lang, err === 'wrongCreds' ? 'wrongCreds' : 'connError'))
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 animate-fade-in-up">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4"><StradeoMark size={72} /></div>
          <h1 className="text-[32px] font-bold tracking-tight mb-1 leading-tight">Stradeo</h1>
          <p className="text-sm text-stradeo-inkdim"><span className="font-mono">7,139</span> official Patente B questions</p>
        </div>

        <div className="flex justify-center gap-1.5 mb-7">
          {(Object.entries(LANGUAGES) as [Language, string][]).map(([k, name]) => (
            <button key={k} onClick={() => setLang(k)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${lang === k ? 'bg-stradeo-ink text-stradeo-bg' : 'border border-stradeo-line text-stradeo-inkdim hover:text-stradeo-ink'}`}
            >{name}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-stradeo-bg2 border border-stradeo-line rounded-[14px] p-6">
          <h2 className="text-lg font-bold mb-5">{t(lang, 'login')}</h2>

          <div className="mb-4">
            <label htmlFor="login-email" className="block text-xs font-semibold text-stradeo-inkdim uppercase tracking-wider mb-1.5">{t(lang, 'email')}</label>
            <input id="login-email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} type="email" required
              className="w-full px-4 py-3 rounded-lg border border-stradeo-line bg-stradeo-bg text-stradeo-ink text-[15px] outline-none focus:border-stradeo-ink"
              placeholder="you@email.com" />
          </div>

          <div className="mb-5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-stradeo-inkdim uppercase tracking-wider mb-1.5">{t(lang, 'password')}</label>
            <input id="login-password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} type="password" required
              className="w-full px-4 py-3 rounded-lg border border-stradeo-line bg-stradeo-bg text-stradeo-ink text-[15px] outline-none focus:border-stradeo-ink"
              placeholder="••••••••" />
          </div>

          {error && (
            <div className="bg-stradeo-accent2/10 rounded-lg px-3.5 py-2.5 mb-4 text-[13px] text-stradeo-accent2">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-base font-bold disabled:opacity-50">
            {loading ? '...' : t(lang, 'loginBtn')}
          </button>
        </form>

        <p className="text-center text-[11px] text-stradeo-inkfaint mt-5">{t(lang, 'contactAdmin')} · <a href="/privacy" className="underline hover:text-stradeo-ink">Privacy</a></p>
      </div>
    </div>
  )
}
