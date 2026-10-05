'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import { devicePlatform } from '@/lib/authLink'
import StradeoMark from './StradeoMark'
import { IconShare, IconAddSquare, IconMore, IconCheck, IconMenu } from './icons'

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
    // Newer Safari (iOS 26) keeps Share inside the menu (three bars); older Safari
    // has Share right in the bottom bar, which the note under the steps covers.
    ? [[<IconMenu key="i" size={15} />, 'installIosMenu'], [<IconShare key="i" size={16} />, 'installIos1'], [<IconAddSquare key="i" size={16} />, 'installIos2'], [<span key="i" className="font-bold text-[12px]">Add</span>, 'installIos3']] as const
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
        <ol className="space-y-1.5 short:space-y-1 stagger">
          {steps.map(([icon, key], i) => (
            <li key={key} className="flex items-center gap-3 short:gap-2.5 rounded-[10px] border border-stradeo-line bg-stradeo-bg px-3 short:px-2.5 py-1.5 short:py-1">
              <span className="flex h-6 w-6 short:h-5 short:w-5 shrink-0 items-center justify-center rounded-[6px] bg-stradeo-ink font-mono text-[12px] short:text-[11px] text-stradeo-bg">{i + 1}</span>
              <span className="flex-1 text-[13px] short:text-[12.5px] leading-snug">{t(lang, key)}</span>
              <span className="flex h-7 min-w-7 short:h-6 short:min-w-6 shrink-0 items-center justify-center rounded-[8px] bg-stradeo-blue/10 px-2 short:px-1.5 text-stradeo-blue">{icon}</span>
            </li>
          ))}
          {platform === 'ios' && <li className="pt-0.5 text-[11px] leading-snug text-stradeo-inkdim">{t(lang, 'installIosOld')}</li>}
        </ol>
      )}
    </div>
  )
}
