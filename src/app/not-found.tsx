'use client'
import Link from 'next/link'
import StradeoMark from '@/components/StradeoMark'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

export default function NotFound() {
  const { lang } = useLanguage()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <StradeoMark size={64} />
      <p className="font-mono text-sm text-stradeo-inkfaint mt-6">404</p>
      <p className="text-stradeo-inkdim mt-2 mb-6">{t(lang, 'pageNotFound')}</p>
      <Link href="/" className="inline-block px-5 py-3 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand font-bold">{t(lang, 'home')}</Link>
    </div>
  )
}
