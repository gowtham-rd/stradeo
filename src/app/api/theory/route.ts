import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { topicNameIt, topicNameEn, language } = await req.json()

  if (!topicNameIt || !topicNameEn || !language) {
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
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a driving instructor helping someone study for the Italian Patente B exam. Respond in ${language}.

Create a focused study lesson for this topic: "${topicNameIt}" (${topicNameEn})

Format your response EXACTLY like this with these section markers:
§TITLE§ (a short engaging title for this lesson)
§KEYPOINTS§ (5-7 most important rules to memorize, each on a new line starting with •)
§DETAILS§ (2-3 paragraphs explaining the key concepts, with specific numbers/limits where relevant)
§TRAPS§ (3-4 common exam traps for this topic, each on a new line starting with ⚠)
§REMEMBER§ (a one-line memory trick or summary to remember the most important rule)

Be specific with Italian driving rules, numbers, and limits. Keep it concise but complete.`
      }],
    }),
  })

  const data = await res.json()
  const text = data.content?.find((c: any) => c.type === 'text')?.text || ''

  // Parse sections
  const sections: Record<string, string> = {}
  const markers = ['TITLE', 'KEYPOINTS', 'DETAILS', 'TRAPS', 'REMEMBER']
  markers.forEach((m, i) => {
    const start = text.indexOf(`§${m}§`)
    if (start === -1) return
    const contentStart = start + m.length + 2
    const nextMarker = markers.slice(i + 1).find((nm: string) => text.indexOf(`§${nm}§`) > -1)
    const end = nextMarker ? text.indexOf(`§${nextMarker}§`) : text.length
    sections[m.toLowerCase()] = text.substring(contentStart, end).trim()
  })

  if (!sections.title) sections.title = topicNameEn
  return NextResponse.json(sections)
}
