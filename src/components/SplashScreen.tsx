'use client'
import StradeoMark from './StradeoMark'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

export default function SplashScreen() {
  const { lang } = useLanguage()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center animate-fade-in-up">
      <div className="mb-5"><StradeoMark size={96} /></div>
      <h1 className="text-[40px] leading-tight font-bold tracking-tight text-center mb-2">Stradeo</h1>
      <p className="text-base text-stradeo-inkdim text-center">{t(lang, 'tagline')}</p>
      <div className="flex justify-center mt-8">
        <div className="w-10 h-1 rounded bg-stradeo-surface2 overflow-hidden">
          <div className="w-full h-full bg-stradeo-ink animate-[loading_2s_ease-in-out]" />
        </div>
      </div>
      <style>{`@keyframes loading{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
    </div>
  )
}
