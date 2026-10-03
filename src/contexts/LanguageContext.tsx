'use client'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import type { Language } from '@/types'

const STORAGE_KEY = 'stradeo-lang'
const VALID: Language[] = ['en', 'it', 'ta', 'hi']

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  // Restore the saved choice after hydration so it survives reloads.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      if (saved && VALID.includes(saved)) setLangState(saved)
    } catch { /* storage blocked */ }
  }, [])

  const setLang = useCallback((next: Language) => {
    setLangState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* storage blocked */ }
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
