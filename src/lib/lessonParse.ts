// Splits a lesson's text into the parts the lesson screen shows. Lessons come in
// a few shapes (written at different times), all handled here:
//   "**Heading**\n\nparagraph…"        heading on its own line
//   "**Heading**\nparagraph…"          heading on the first line of the block
//   "**Heading.** paragraph…"          heading as a bold first sentence
//   "paragraph…" only                 no headings: each paragraph is a section,
//                                      titled by its first words

const firstWords = (text: string, max = 7) => {
  const plain = text.replace(/\*\*?([^*]+)\*\*?/g, '$1')
  const cut = plain.search(/[.:;]\s/)
  const sentence = cut >= 0 ? plain.slice(0, cut + 1) : plain
  const ws = sentence.split(/\s+/)
  return ws.length > max ? ws.slice(0, max).join(' ') + '…' : sentence.replace(/[.:;]$/, '')
}

// A paragraph that opens with a bold term ("**Trams (tram)** occupy…") is titled by it.
const boldTerm = (text: string) => {
  const m = text.slice(0, 160).match(/\*\*([^*]{3,60})\*\*/)
  if (!m) return null
  const term = m[1].trim()
  return term.charAt(0).toUpperCase() + term.slice(1)
}

export function sectionsOf(details: string) {
  const out: { title: string; paras: string[] }[] = []
  let headed = false
  for (const block of details.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)) {
    const own = block.match(/^\*\*([^*]+)\*\*\s*$/)
    const firstLine = block.match(/^\*\*([^*]+)\*\*\n([\s\S]*)$/)
    const inline = block.match(/^\*\*([^*]+?)(?:[.:]\*\*|\*\*[.:])\s+([\s\S]+)$/)
    if (own) { headed = true; out.push({ title: own[1].trim(), paras: [] }) }
    else if (firstLine) { headed = true; out.push({ title: firstLine[1].trim(), paras: [firstLine[2].trim()] }) }
    else if (inline && inline[1].length <= 150) { headed = true; out.push({ title: inline[1].trim().replace(/[.:]$/, ''), paras: [inline[2].trim()] }) }
    else if (!headed) out.push({ title: boldTerm(block) ?? firstWords(block), paras: [block] })
    else out[out.length - 1].paras.push(block)
  }
  return out.filter(s => s.paras.length)
}

/** One exam trap, in any of the shapes the lessons use:
 *    ⚠ "statement" — FALSE. The real rule…
 *    ⚠ **"statement"** — FALSE. …          ⚠ "statement." FALSE — …
 *    ⚠ TRAP — "statement": FALSE. …        ⚠ TRAP — "statement": the exam says…
 *  → { claim, verdict, fact } (claim empty when the line has no quoted statement). */
const LABEL = new RegExp('^\\p{Lu}{4,}\\s*[—–-]\\s*', 'u') // "TRAP —", "TRANELLO —"
const TRAP = new RegExp('^["“«](.+?)["”»]\\s*[:.—–-]?\\s*(\\p{Lu}{4,})?\\s*[.!:—–-]?\\s*([\\s\\S]*)$', 'u')
export function trapsOf(traps: string) {
  return traps.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const clean = line.replace(/^⚠\s*/, '').replace(LABEL, '').replace(/^\*\*(["“«][^*]+?["”»])\*\*/, '$1')
    const m = clean.match(TRAP)
    if (!m || !m[3]) return { claim: '', verdict: '', fact: clean }
    const fact = m[3].charAt(0).toUpperCase() + m[3].slice(1)
    return { claim: m[1].replace(/[.]$/, ''), verdict: m[2] ?? '', fact }
  })
}
