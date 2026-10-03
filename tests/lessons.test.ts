import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const FIELDS = ['title', 'keypoints', 'details', 'traps', 'remember'] as const
const load = (p: string) => JSON.parse(readFileSync(p, 'utf8'))

const sets: [string, string][] = [
  ['en', 'public/data/theory_lessons.json'],
  ...(['it', 'ta', 'hi'] as const).map(l => [l, `public/data/lessons/${l}.json`] as [string, string]).filter(([, p]) => existsSync(p)),
]

for (const [lang, path] of sets) {
  test(`lessons (${lang}): all 25 topics complete, nothing cut off`, () => {
    const L = load(path)
    for (let t = 1; t <= 25; t++) {
      const l = L[String(t)]
      assert.ok(l, `topic ${t} missing`)
      for (const f of FIELDS) assert.ok(l[f]?.trim(), `topic ${t}: empty ${f}`)
      // A cut-off generation ends mid-word; complete text ends with punctuation or a closing mark.
      assert.match(l.remember.trim(), /[.!?)"»”’*।]$/, `topic ${t}: remember looks cut off`)
      assert.match(l.traps.trim(), /[.!?)"»”’*।]$/, `topic ${t}: traps look cut off`)
    }
  })
}

test('translations have the same number of exam traps as English', () => {
  const en = load('public/data/theory_lessons.json')
  for (const [lang, path] of sets.slice(1)) {
    const L = load(path)
    for (let t = 1; t <= 25; t++) {
      const count = (s: string) => (s.match(/⚠/g) || []).length
      assert.equal(count(L[String(t)].traps), count(en[String(t)].traps), `${lang} topic ${t}`)
    }
  }
})
