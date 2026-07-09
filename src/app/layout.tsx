import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ProgressProvider } from '@/contexts/ProgressContext'

export const metadata: Metadata = {
  title: 'Stradeo — Patente B Quiz',
  description: 'Your Italian driving license companion. 7,139 official Ministry questions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LanguageProvider>
            <ProgressProvider>
              {children}
            </ProgressProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
