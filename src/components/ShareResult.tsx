'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { t } from '@/lib/i18n'
import { drawCard, type CardData } from '@/lib/shareCard'
import { toast } from '@/lib/toast'
import { IconShare, IconDownload } from './icons'

const LOCALE = { en: 'en-GB', it: 'it-IT', ta: 'ta-IN', hi: 'hi-IN' } as const

// Share / save the exam result as an image. The image is drawn as soon as the
// result is shown, so tapping Share opens the share sheet straight away (iPhone
// only allows that directly from the tap).
export default function ShareResult(props: Omit<CardData, 'labels' | 'locale' | 'name' | 'dark'>) {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [canShare, setCanShare] = useState(false)
  // Same look as the app right now: Light, Dark, or the phone's setting on Auto.
  const { theme } = useTheme()
  const [dark, setDark] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const read = () => setDark(theme === 'dark' || (theme === 'auto' && mq.matches))
    read(); mq.addEventListener('change', read)
    return () => mq.removeEventListener('change', read)
  }, [theme])
  const key = props.marks.join('') + props.at + lang + dark

  useEffect(() => {
    let off = false
    setFile(null)
    drawCard({
      ...props, dark, locale: LOCALE[lang], name: user?.name || undefined,
      labels: {
        verdict: t(lang, props.passed ? 'passed' : 'failed'), errors: t(lang, 'errors'), max: t(lang, 'max3'),
        time: t(lang, 'timeUsed'), footer: t(lang, 'shareFooter'),
      },
    }).then(blob => {
      if (off) return
      const f = new File([blob], `stradeo-exam-${props.score}-${props.total}.png`, { type: 'image/png' })
      setFile(f)
      setCanShare(!!navigator.canShare?.({ files: [f] }))
    }, () => {})
    return () => { off = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user?.name])

  const download = () => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const a = document.createElement('a'); a.href = url; a.download = file.name
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    toast({ tone: 'ok', title: t(lang, 'imageSaved'), note: file.name })
  }
  const share = async () => {
    if (!file) return
    if (!canShare) { download(); return }
    try { await navigator.share({ files: [file] }) }
    catch (e) { if ((e as Error).name !== 'AbortError') download() }
  }

  const btn = 'h-11 rounded-[10px] text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity'
  return (
    <div className="mt-4 flex gap-2">
      <button type="button" onClick={share} disabled={!file}
        className={`${btn} flex-1 bg-stradeo-ink text-stradeo-bg`}>
        <IconShare size={15} />{t(lang, 'shareResult')}
      </button>
      {canShare && (
        <button type="button" onClick={download} disabled={!file} aria-label={t(lang, 'saveImage')}
          className={`${btn} w-11 border border-stradeo-line text-stradeo-ink hover:border-stradeo-ink`}>
          <IconDownload size={16} />
        </button>
      )}
    </div>
  )
}
