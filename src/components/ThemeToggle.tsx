'use client'
import { useTheme, type ThemeChoice } from '@/contexts/ThemeContext'

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'auto', label: 'Auto' },
  { value: 'dark', label: 'Dark' },
]

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  return (
    <div role="radiogroup" aria-label="Theme"
      className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-stradeo-line bg-stradeo-bg2 p-0.5 text-sm">
      {OPTIONS.map(o => (
        <button key={o.value} role="radio" aria-checked={theme === o.value} aria-label={o.label}
          onClick={() => setTheme(o.value)}
          className={`h-full rounded-md px-2.5 ${theme === o.value ? 'bg-stradeo-ink text-stradeo-bg font-semibold' : 'text-stradeo-inkdim hover:text-stradeo-ink'}`}>
          {compact ? o.label[0] : o.label}
        </button>
      ))}
    </div>
  )
}
