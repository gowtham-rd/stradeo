'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import { devicePlatform } from '@/lib/authLink'
import StradeoMark from './StradeoMark'
import { IconShare, IconAddSquare, IconMore, IconCheck } from './icons'

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

// How to add Stradeo to the Home Screen on this phone: three numbered steps for
// iPhone (Safari Share sheet) or Android (Chrome menu), plus a one-tap Install
// button where the browser offers one.
export default function InstallGuide({ compact = false }: { compact?: boolean }) {
  const { lang } = useLanguage()
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('ios')
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    setPlatform(devicePlatform())
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt) }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setPrompt(null)
  }

  if (platform === 'desktop') return <p className="text-[13px] leading-relaxed text-stradeo-inkdim">{t(lang, 'installDesktop')}</p>

  const steps = platform === 'ios'
    ? [[<IconShare key="i" size={16} />, 'installIos1'], [<IconAddSquare key="i" size={16} />, 'installIos2'], [<span key="i" className="font-bold text-[12px]">Add</span>, 'installIos3']] as const
    : [[<IconMore key="i" size={16} />, 'installAnd1'], [<IconAddSquare key="i" size={16} />, 'installAnd2'], [<IconCheck key="i" size={13} />, 'installAnd3']] as const

  return (
    <div>
      {!compact && (
        <div className="mb-4 flex items-center gap-3">
          <StradeoMark size={44} />
          <p className="text-[13px] leading-snug text-stradeo-inkdim">{t(lang, 'installWhy')}</p>
        </div>
      )}
      {installed ? (
        <p className="flex items-center gap-2 rounded-[10px] bg-stradeo-green/[0.1] px-3 py-2.5 text-[13px] font-semibold text-stradeo-green"><IconCheck size={13} />{t(lang, 'installOpenIcon')}</p>
      ) : prompt ? (
        <button type="button" onClick={install}
          className="w-full py-3.5 rounded-[10px] bg-stradeo-brand text-stradeo-onbrand text-base font-bold inline-flex items-center justify-center gap-2">
          <IconAddSquare size={16} />{t(lang, 'installBtn')}
        </button>
      ) : (
        <ol className="space-y-2">
          {steps.map(([icon, key], i) => (
            <li key={key} className="flex items-center gap-3 rounded-[10px] border border-stradeo-line bg-stradeo-bg px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-stradeo-ink font-mono text-[12px] text-stradeo-bg">{i + 1}</span>
              <span className="flex-1 text-[13px] leading-snug">{t(lang, key)}</span>
              <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-[8px] bg-stradeo-blue/10 px-2 text-stradeo-blue">{icon}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
