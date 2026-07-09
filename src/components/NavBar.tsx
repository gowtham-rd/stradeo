'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { LANGUAGES, t } from '@/lib/i18n'
import type { Language } from '@/types'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function NavBar() {
  const { signOut } = useAuth()
  const { lang, setLang } = useLanguage()
  const { theme, toggle } = useTheme()
  const [showLang, setShowLang] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <div className="sticky top-0 z-50 bg-stradeo-nav backdrop-blur-[20px] border-b border-stradeo-line px-5 py-3">
      <div className="max-w-[640px] mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo/nav.png" alt="S" className="w-8 h-8 rounded-full" />
          <span className="text-[17px] font-bold tracking-tight">Stradeo</span>
        </Link>
        <div className="flex items-center gap-2">
          {!isHome && (
            <Link href="/" className="text-stradeo-accent text-sm font-semibold">← {t(lang, 'home')}</Link>
          )}
          <button onClick={toggle} aria-label="Toggle theme"
            className="px-2.5 py-1.5 rounded-lg border border-stradeo-line bg-stradeo-surface2 text-sm">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="relative">
            <button onClick={() => setShowLang(!showLang)}
              className="px-3 py-1.5 rounded-lg border border-stradeo-line bg-stradeo-surface2 text-stradeo-inkdim text-xs font-semibold">
              {LANGUAGES[lang]} ▾
            </button>
            {showLang && (
              <div className="absolute right-0 top-full mt-1 bg-stradeo-bg2 border border-stradeo-line rounded-[10px] overflow-hidden z-[100] min-w-[120px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                {(Object.entries(LANGUAGES) as [Language, string][]).map(([k, nm]) => (
                  <button key={k} onClick={() => { setLang(k); setShowLang(false) }}
                    className={`block w-full px-4 py-2.5 text-[13px] font-semibold text-left ${lang === k ? 'bg-orange-500/10 text-stradeo-accent' : 'text-stradeo-inkdim'}`}>
                    {nm}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={signOut}
            className="px-3 py-1.5 rounded-lg border border-stradeo-line text-stradeo-inkdim text-xs">
            {t(lang, 'logout')}
          </button>
        </div>
      </div>
    </div>
  )
}
