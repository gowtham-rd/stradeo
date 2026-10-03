'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { t } from '@/lib/i18n'
import StradeoMark from './StradeoMark'
import { IconHome, IconStreak, IconSettings } from '@/components/icons'

// Top bar, three columns: streak (left) · app mark + title, which is the Home
// button (centre) · Settings (right). Away from Home the centre shows a home glyph.
export default function NavBar() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const { streak } = useProgress()
  const pathname = usePathname()
  const isHome = pathname === '/'
  const onSettings = pathname === '/settings'

  return (
    <div className="sticky top-0 z-50 bg-stradeo-nav backdrop-blur-[20px] border-b border-stradeo-line px-4 pb-2.5 pt-[max(10px,env(safe-area-inset-top))]">
      <div className="max-w-[640px] mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex justify-start">
          {user && streak > 0 && (
            <div className="flex h-9 items-center gap-1 px-2.5 rounded-[10px] border border-stradeo-line bg-stradeo-bg2"
              title={t(lang, 'streak')} aria-label={`${t(lang, 'streak')}: ${streak}`}>
              <IconStreak size={15} className="text-stradeo-brandorange" />
              <span className="font-mono text-sm text-stradeo-ink">{streak}</span>
            </div>
          )}
        </div>

        <Link href="/" aria-label={isHome ? 'Stradeo' : `${t(lang, 'home')} · Stradeo`} aria-current={isHome ? 'page' : undefined}
          className={`group flex h-9 items-center gap-2 rounded-[10px] transition-colors ${isHome ? 'px-1' : 'pl-1 pr-3 border border-stradeo-line bg-stradeo-bg2 hover:border-stradeo-ink'}`}>
          {!isHome && (
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-stradeo-surface2 text-stradeo-ink animate-fade-in">
              <IconHome size={15} />
            </span>
          )}
          <StradeoMark size={isHome ? 30 : 24} />
          <span className={`${isHome ? 'text-[17px]' : 'text-[15px]'} font-bold tracking-tight`}>Stradeo</span>
        </Link>

        <div className="flex justify-end">
          {user && (
            <Link href="/settings" aria-label={t(lang, 'settings')} aria-current={onSettings ? 'page' : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-[10px] border bg-stradeo-bg2 ${onSettings ? 'border-stradeo-ink text-stradeo-ink' : 'border-stradeo-line text-stradeo-inkdim hover:text-stradeo-ink'}`}>
              <IconSettings size={17} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
