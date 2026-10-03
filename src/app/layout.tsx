import type { Metadata, Viewport } from 'next'
import '@fontsource/titillium-web/400.css'
import '@fontsource/titillium-web/600.css'
import '@fontsource/titillium-web/700.css'
import '@fontsource/jetbrains-mono/400.css'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ProgressProvider } from '@/contexts/ProgressContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import AuthGate from '@/components/AuthGate'
import ServiceWorker from '@/components/ServiceWorker'

export const metadata: Metadata = {
  title: 'Stradeo — Patente B Quiz',
  description: 'Your Italian driving license companion. 7,139 official Ministry questions.',
  applicationName: 'Stradeo',
  appleWebApp: { capable: true, title: 'Stradeo', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B0A' },
  ],
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
                <AuthGate>{children}</AuthGate>
                <ServiceWorker />
              </ProgressProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
