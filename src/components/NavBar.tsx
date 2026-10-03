'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProgress } from '@/contexts/ProgressContext'
import { t } from '@/lib/i18n'
import StradeoMark from './StradeoMark'
import { IconArrowLeft, IconStreak, IconSettings } from '@/components/icons'

// Top bar: logo (+ Home link away from Home) on the left; streak and Settings on the right.
export default function NavBar() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const { streak } = useProgress()
  const pathname = usePathname()
  const isHome = pathname === '/'
  const onSettings = pathname === '/settings'

  return (
    <div className="sticky top-0 z-50 bg-stradeo-nav backdrop-blur-[20px] border-b border-stradeo-line px-4 py-3">
      <div className="max-w-[640px] mx-auto flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <StradeoMark size={32} />
          <span className="text-[17px] font-bold tracking-tight max-[359px]:sr-only">Stradeo</span>
        </Link>
        {!isHome && (
          <Link href="/" className="inline-flex items-center gap-1.5 text-stradeo-inkdim hover:text-stradeo-ink text-sm font-semibold whitespace-nowrap">
            <IconArrowLeft size={14} />{t(lang, 'home')}
          </Link>
        )}
        {user && (
          <div className="ml-auto flex items-center gap-2">
            {streak > 0 && (
              <div className="flex h-8 items-center gap-1 px-2.5 rounded-lg border border-stradeo-line bg-stradeo-bg2"
                title={t(lang, 'streak')} aria-label={`${t(lang, 'streak')}: ${streak}`}>
                <IconStreak size={15} className="text-stradeo-brandorange" />
                <span className="font-mono text-sm text-stradeo-ink">{streak}</span>
              </div>
            )}
            <Link href="/settings" aria-label={t(lang, 'settings')} aria-current={onSettings ? 'page' : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-stradeo-bg2 ${onSettings ? 'border-stradeo-ink text-stradeo-ink' : 'border-stradeo-line text-stradeo-inkdim hover:text-stradeo-ink'}`}>
              <IconSettings size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
