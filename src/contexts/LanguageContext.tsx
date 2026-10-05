'use client'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import type { Language } from '@/types'
import { LANG_ENABLED } from '@/lib/i18n'

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
      // A saved language that's switched off for now (Tamil, Hindi) falls back to English.
      if (saved && VALID.includes(saved)) setLangState(LANG_ENABLED[saved] ? saved : 'en')
    } catch { /* storage blocked */ }
  }, [])

  // Keep <html lang> in sync for screen readers and hyphenation.
  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const setLang = useCallback((next: Language) => {
    if (!LANG_ENABLED[next]) return
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
