'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGES, t } from '@/lib/i18n'
import type { Language } from '@/types'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import StradeoMark from './StradeoMark'
import ThemeToggle from './ThemeToggle'
import { IconArrowLeft, IconChevronDown } from '@/components/icons'

export default function NavBar() {
  const { signOut } = useAuth()
  const { lang, setLang } = useLanguage()
  const [showLang, setShowLang] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <div className="sticky top-0 z-50 bg-stradeo-nav backdrop-blur-[20px] border-b border-stradeo-line px-4 py-3">
      <div className="max-w-[640px] mx-auto flex justify-between items-center gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5">
            <StradeoMark size={32} />
            <span className="text-[17px] font-bold tracking-tight max-[399px]:sr-only">Stradeo</span>
          </Link>
          {!isHome && (
            <Link href="/" aria-label={t(lang, 'home')} className="inline-flex items-center gap-1.5 text-stradeo-inkdim hover:text-stradeo-ink text-sm font-semibold whitespace-nowrap"><IconArrowLeft size={14} /><span className="hidden sm:inline">{t(lang, 'home')}</span></Link>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden sm:block"><ThemeToggle /></div>
          <div className="sm:hidden"><ThemeToggle compact /></div>
          <div className="relative">
            <button onClick={() => setShowLang(!showLang)} aria-expanded={showLang}
              className="h-8 px-2.5 rounded-lg border border-stradeo-line bg-stradeo-bg2 text-stradeo-inkdim hover:text-stradeo-ink text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1">
              {LANGUAGES[lang]} <IconChevronDown size={10} />
            </button>
            {showLang && (
              <div className="absolute right-0 top-full mt-1 bg-stradeo-bg2 border border-stradeo-line rounded-[10px] overflow-hidden z-[100] min-w-[120px]">
                {(Object.entries(LANGUAGES) as [Language, string][]).map(([k, nm]) => (
                  <button key={k} onClick={() => { setLang(k); setShowLang(false) }}
                    className={`block w-full px-4 py-2.5 text-[13px] font-semibold text-left ${lang === k ? 'bg-stradeo-surface2 text-stradeo-ink' : 'text-stradeo-inkdim hover:text-stradeo-ink'}`}>
                    {nm}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={signOut}
            className="h-8 px-2.5 rounded-lg border border-stradeo-line text-stradeo-inkdim hover:text-stradeo-ink text-xs whitespace-nowrap">
            {t(lang, 'logout')}
          </button>
        </div>
      </div>
    </div>
  )
}
