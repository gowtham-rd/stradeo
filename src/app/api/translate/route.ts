import { NextRequest, NextResponse } from 'next/server'
import { guardAiRequest, isAllowedLanguage, isShortText } from '@/lib/serverAuth'

export async function POST(req: NextRequest) {
  const denied = await guardAiRequest(req)
  if (denied) return denied

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { question, language } = body as Record<string, any>

  if (!question || !language) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!isAllowedLanguage(language) || !isShortText(question)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  if (language === 'Italian') {
    return NextResponse.json({ translation: question })
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Translate this Italian driving exam question to ${language}. Return ONLY the translation, nothing else:\n\n"${question}"`
      }],
    }),
  })

  if (!res.ok) return NextResponse.json({ error: 'AI request failed' }, { status: 502 })
  const data = await res.json()
  const text = data.content?.find((c: any) => c.type === 'text')?.text || question
  return NextResponse.json({ translation: text })
}
