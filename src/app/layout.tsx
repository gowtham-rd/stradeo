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
import AuthLinkRouter from '@/components/AuthLinkRouter'
import ServiceWorker from '@/components/ServiceWorker'
import PullToRefresh from '@/components/PullToRefresh'
import ConnectionStatus from '@/components/ConnectionStatus'
import { noFlashTextSize } from '@/lib/textSize'
import StartupImages from '@/components/StartupImages'

export const metadata: Metadata = {
  title: 'Stradeo — Patente B Quiz',
  description: 'Your Italian driving license companion. 7,106 official Ministry questions.',
  applicationName: 'Stradeo',
  appleWebApp: { capable: true, title: 'Stradeo', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  // Draw edge to edge on iPhone; bars pad themselves with env(safe-area-inset-*).
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B0A' },
  ],
}

// Applies a saved Light/Dark choice before first paint. No saved choice = Auto (follows the device).
const noFlashTheme = `try{var t=localStorage.getItem('stradeo-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}`
// Paints the right background on the very first frame, before the stylesheet arrives,
// so a dark-mode phone never flashes white on launch.
const firstPaint = `html{background:#FAFAF8;color-scheme:light}@media (prefers-color-scheme:dark){html:not([data-theme=light]){background:#0B0B0A;color-scheme:dark}}html[data-theme=dark]{background:#0B0B0A;color-scheme:dark}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <style dangerouslySetInnerHTML={{ __html: firstPaint }} />
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme + noFlashTextSize }} />
        <StartupImages />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <ProgressProvider>
                <AuthLinkRouter />
                <AuthGate>{children}</AuthGate>
                <ServiceWorker />
                <PullToRefresh />
                <ConnectionStatus />
              </ProgressProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
