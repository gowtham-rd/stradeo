// Usage: node scripts/add-i18n.mjs keys.json — inserts { en:{}, it:{}, ta:{}, hi:{} }
// into each language block of src/lib/i18n.ts (before the nothingDue anchor).
import { readFileSync, writeFileSync } from 'node:fs'
const add = JSON.parse(readFileSync(process.argv[2], 'utf8'))
let src = readFileSync('src/lib/i18n.ts', 'utf8')
const order = ['en', 'it', 'ta', 'hi']
let i = 0, from = 0
for (const lang of order) {
  const at = src.indexOf('    nothingDue:', from)
  if (at < 0) throw new Error('anchor missing for ' + lang)
  const entries = Object.entries(add[lang] || {})
  for (const [k] of entries) if (new RegExp(`\\b${k}:`).test(src.slice(at, src.indexOf('\n', at)))) throw new Error('dup ' + k)
  const line = '    ' + entries.map(([k, v]) => `${k}: ${JSON.stringify(v)},`).join(' ') + '\n'
  src = src.slice(0, at) + line + src.slice(at)
  from = at + line.length + 20
  i++
}
writeFileSync('src/lib/i18n.ts', src)
console.log('added', Object.keys(add.en).length, 'keys x', i)
