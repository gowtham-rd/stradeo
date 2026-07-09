import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { question, correctAnswer, language } = await req.json()

  if (!question || correctAnswer === undefined || !language) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
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
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You help study for Italian Patente B. Respond in ${language}.\n\nQuestion: "${question}"\nCorrect: ${correctAnswer ? 'VERO' : 'FALSO'}\n\nExplain in 2-3 sentences why. Be specific about the Italian rule.`
      }],
    }),
  })

  const data = await res.json()
  const text = data.content?.find((c: any) => c.type === 'text')?.text || 'Unavailable.'
  return NextResponse.json({ explanation: text })
}
