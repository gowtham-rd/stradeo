import { NextRequest, NextResponse } from 'next/server'
import { guardAiRequest, isAllowedLanguage, isShortText } from '@/lib/serverAuth'

export async function POST(req: NextRequest) {
  const denied = await guardAiRequest(req)
  if (denied) return denied

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { question, correctAnswer, language } = body as Record<string, any>

  if (!question || typeof correctAnswer !== 'boolean' || !language) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!isAllowedLanguage(language) || !isShortText(question)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
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
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You help study for Italian Patente B. Respond in ${language}.\n\nQuestion: "${question}"\nCorrect: ${correctAnswer ? 'VERO' : 'FALSO'}\n\nExplain in 2-3 sentences why. Be specific about the Italian rule.`
      }],
    }),
  })

  if (!res.ok) return NextResponse.json({ error: 'AI request failed' }, { status: 502 })
  const data = await res.json()
  const text = data.content?.find((c: any) => c.type === 'text')?.text || 'Unavailable.'
  return NextResponse.json({ explanation: text })
}
