import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { question, language } = await req.json()

  if (!question || !language) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
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
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Translate this Italian driving exam question to ${language}. Return ONLY the translation, nothing else:\n\n"${question}"`
      }],
    }),
  })

  const data = await res.json()
  const text = data.content?.find((c: any) => c.type === 'text')?.text || question
  return NextResponse.json({ translation: text })
}
