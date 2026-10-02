import type { Metadata } from 'next'
import '@fontsource/titillium-web/400.css'
import '@fontsource/titillium-web/600.css'
import '@fontsource/titillium-web/700.css'
import '@fontsource/jetbrains-mono/400.css'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ProgressProvider } from '@/contexts/ProgressContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Stradeo — Patente B Quiz',
  description: 'Your Italian driving license companion. 7,139 official Ministry questions.',
}

// Applies a saved Light/Dark choice before first paint. No saved choice = Auto (follows the device).
const noFlashTheme = `try{var t=localStorage.getItem('stradeo-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
