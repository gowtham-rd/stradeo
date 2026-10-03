import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side guard for the AI routes: only signed-in Stradeo users may call them,
// so nobody on the internet can spend the Claude credits.
const ALLOWED_LANGUAGES = new Set(['English', 'Italian', 'Tamil', 'Hindi'])
const MAX_TEXT = 600

export async function guardAiRequest(req: NextRequest): Promise<NextResponse | null> {
  if (!process.env.CLAUDE_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export function isAllowedLanguage(language: unknown): language is string {
  return typeof language === 'string' && ALLOWED_LANGUAGES.has(language)
}

export function isShortText(...values: unknown[]): boolean {
  return values.every(v => typeof v === 'string' && v.length > 0 && v.length <= MAX_TEXT)
}
