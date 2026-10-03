'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import StradeoMark from './StradeoMark'
import { IconArrowLeft } from '@/components/icons'

// Top bar: logo, plus a Home link away from Home. Theme, language and log out
// live in Settings (gear next to the streak on Home).
export default function NavBar() {
  const { lang } = useLanguage()
  const isHome = usePathname() === '/'

  return (
    <div className="sticky top-0 z-50 bg-stradeo-nav backdrop-blur-[20px] border-b border-stradeo-line px-4 py-3">
      <div className="max-w-[640px] mx-auto flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <StradeoMark size={32} />
          <span className="text-[17px] font-bold tracking-tight">Stradeo</span>
        </Link>
        {!isHome && (
          <Link href="/" className="ml-auto inline-flex items-center gap-1.5 text-stradeo-inkdim hover:text-stradeo-ink text-sm font-semibold whitespace-nowrap">
            <IconArrowLeft size={14} />{t(lang, 'home')}
          </Link>
        )}
      </div>
    </div>
  )
}
