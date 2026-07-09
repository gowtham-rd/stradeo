import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ProgressProvider } from '@/contexts/ProgressContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Stradeo — Patente B Quiz',
  description: 'Your Italian driving license companion. 7,139 official Ministry questions.',
}

// Applies the saved theme before first paint to avoid a flash of the wrong theme.
const noFlashTheme = `try{var t=localStorage.getItem('stradeo-theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <ProgressProvider>
                {children}
              </ProgressProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
