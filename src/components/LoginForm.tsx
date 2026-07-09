'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { LANGUAGES, t } from '@/lib/i18n'
import type { Language } from '@/types'

export default function LoginForm() {
  const { signIn } = useAuth()
  const { lang, setLang } = useLanguage()
  const { theme, toggle } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email, password)
    if (err) setError(t(lang, 'wrongCreds'))
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 animate-fade-in-up">
      <button onClick={toggle} aria-label="Toggle theme"
        className="absolute top-4 right-4 px-2.5 py-1.5 rounded-lg border border-stradeo-line bg-stradeo-surface2 text-sm">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-10">
          <img src="/logo/login.png" alt="Stradeo" className="w-20 h-20 rounded-full mx-auto mb-4" />
          <h1 className="text-[28px] font-extrabold tracking-tight mb-1">Stradeo</h1>
          <p className="text-[13px] text-stradeo-inkfaint">7,139 official Patente B questions</p>
        </div>

        <div className="flex justify-center gap-1.5 mb-7">
          {(Object.entries(LANGUAGES) as [Language, string][]).map(([k, name]) => (
            <button key={k} onClick={() => setLang(k)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${lang === k ? 'bg-orange-500/[0.12] text-stradeo-accent' : 'bg-stradeo-surface2 text-stradeo-inkdim'}`}
            >{name}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-stradeo-bg2 border border-stradeo-line rounded-[20px] p-7">
          <h2 className="text-lg font-bold text-center mb-5">{t(lang, 'login')}</h2>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-stradeo-inkdim uppercase tracking-wider mb-1.5">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              className="w-full px-4 py-3 rounded-[10px] border border-stradeo-line bg-stradeo-surface2 text-stradeo-ink text-[15px] outline-none"
              placeholder="you@email.com" />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-stradeo-inkdim uppercase tracking-wider mb-1.5">{t(lang, 'password')}</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
              className="w-full px-4 py-3 rounded-[10px] border border-stradeo-line bg-stradeo-surface2 text-stradeo-ink text-[15px] outline-none"
              placeholder="••••••••" />
          </div>

          {error && (
            <div className="bg-red-500/[0.08] border border-red-500/20 rounded-[10px] px-3.5 py-2.5 mb-4 text-[13px] text-red-400 text-center">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 text-white text-base font-bold shadow-[0_4px_20px_rgba(249,115,22,0.25)] disabled:opacity-50">
            {loading ? '...' : t(lang, 'loginBtn')}
          </button>
        </form>

        <p className="text-center text-[11px] text-stradeo-inkfaint mt-5">Contact admin for login credentials</p>
      </div>
    </div>
  )
}
