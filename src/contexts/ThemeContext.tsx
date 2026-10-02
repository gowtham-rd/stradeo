'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Light / Auto / Dark. Auto (the default) follows the device setting.
export type ThemeChoice = 'light' | 'auto' | 'dark'

interface ThemeContextType {
  theme: ThemeChoice
  setTheme: (t: ThemeChoice) => void
}

const STORAGE_KEY = 'stradeo-theme'
const ThemeContext = createContext<ThemeContextType | null>(null)

function apply(choice: ThemeChoice) {
  const root = document.documentElement
  if (choice === 'auto') delete root.dataset.theme
  else root.dataset.theme = choice
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>('auto')

  // The inline script in layout.tsx already applied the saved choice before paint;
  // this only syncs React state to it.
  useEffect(() => {
    let saved: string | null = null
    try { saved = localStorage.getItem(STORAGE_KEY) } catch { /* storage blocked */ }
    setThemeState(saved === 'light' || saved === 'dark' ? saved : 'auto')
  }, [])

  const setTheme = (next: ThemeChoice) => {
    setThemeState(next)
    apply(next)
    try {
      if (next === 'auto') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch { /* storage blocked: still applies for this visit */ }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
