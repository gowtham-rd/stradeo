'use client'
import { useTheme, type ThemeChoice } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { t, type UIKey } from '@/lib/i18n'

const OPTIONS: { value: ThemeChoice; key: UIKey }[] = [
  { value: 'light', key: 'themeLight' },
  { value: 'auto', key: 'themeAuto' },
  { value: 'dark', key: 'themeDark' },
]

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  const { lang } = useLanguage()
  return (
    <div role="radiogroup" aria-label={t(lang, 'theme')}
      className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-stradeo-line bg-stradeo-bg2 p-0.5 text-sm">
      {OPTIONS.map(o => (
        <button key={o.value} role="radio" aria-checked={theme === o.value} aria-label={t(lang, o.key)}
          onClick={() => setTheme(o.value)}
          className={`h-full rounded-md px-2.5 ${theme === o.value ? 'bg-stradeo-ink text-stradeo-bg font-semibold' : 'text-stradeo-inkdim hover:text-stradeo-ink'}`}>
          {compact ? t(lang, o.key)[0] : t(lang, o.key)}
        </button>
      ))}
    </div>
  )
}
