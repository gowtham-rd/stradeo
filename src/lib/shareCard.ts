// Draws the exam result as a 1080×1350 image (4:5 — fits WhatsApp, Instagram
// and the camera roll). Drawn on a canvas in the app, so it works offline.
// Always the dark brand look, whatever theme the app is in.

export interface CardData {
  score: number
  total: number
  passed: boolean
  /** Per question: 'ok' | 'wrong' | 'none'. */
  marks: ('ok' | 'wrong' | 'none')[]
  secs: number | null
  at: number
  name?: string
  locale: string
  labels: { verdict: string; errors: string; max: string; time: string; footer: string }
}

const C = {
  bg: '#0B0B0A', panel: '#171716', line: '#2A2A27', ink: '#F4F4F1', dim: '#8A8A83', faint: '#6B6B65',
  ok: '#4CC27F', bad: '#EF6A6F', none: '#F08A43', brand: '#FFD600', orange: '#FF7A00',
}
const SANS = '"Titillium Web", system-ui, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'
export const W = 1080, H = 1350

const rr = (x: CanvasRenderingContext2D, X: number, Y: number, w: number, h: number, r: number) => {
  x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r)
  x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath()
}

function mark(x: CanvasRenderingContext2D, X: number, Y: number, s: number) {
  const k = s / 64
  x.save(); x.translate(X, Y); x.scale(k, k)
  x.fillStyle = C.orange; rr(x, 0, 0, 64, 64, 14); x.fill()
  x.fillStyle = C.bg
  const poly = (p: number[]) => { x.beginPath(); x.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) x.lineTo(p[i], p[i + 1]); x.closePath(); x.fill() }
  poly([21.2, 8.9, 27.8, 8.9, 19.4, 55.1, 10.6, 55.1]); poly([36.2, 8.9, 42.8, 8.9, 53.4, 55.1, 44.6, 55.1])
  x.fillRect(29.4, 10.5, 5.2, 9); x.fillRect(29, 25.5, 6, 11); x.fillRect(28.6, 42.5, 6.8, 12.6)
  x.restore()
}

export async function drawCard(d: CardData): Promise<Blob> {
  await Promise.all([
    document.fonts.load(`700 100px ${SANS}`), document.fonts.load(`600 40px ${SANS}`),
    document.fonts.load(`400 100px ${MONO}`),
  ]).catch(() => {})
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const x = cv.getContext('2d')!
  const tone = d.passed ? C.ok : C.bad
  const P = 84

  x.fillStyle = C.bg; x.fillRect(0, 0, W, H)
  // Soft glow of the result colour behind the score.
  const g = x.createRadialGradient(W * 0.3, 470, 40, W * 0.3, 470, 620)
  g.addColorStop(0, tone + '30'); g.addColorStop(1, tone + '00')
  x.fillStyle = g; x.fillRect(0, 0, W, H)
  x.textBaseline = 'alphabetic'

  // Header: mark + name of the app, date on the right.
  mark(x, P, 84, 76)
  x.fillStyle = C.ink; x.font = `700 46px ${SANS}`; x.fillText('Stradeo', P + 98, 138)
  x.fillStyle = C.dim; x.font = `400 24px ${MONO}`; x.textAlign = 'right'
  x.fillText('PATENTE B', W - P, 112)
  x.fillText(new Intl.DateTimeFormat(d.locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d.at || Date.now()).toUpperCase(), W - P, 146)
  x.textAlign = 'left'

  // Verdict pill.
  let y = 300
  x.font = `700 40px ${SANS}`
  const vw = x.measureText(d.labels.verdict).width + 64
  x.fillStyle = tone + '24'; rr(x, P, y - 52, vw, 72, 16); x.fill()
  x.fillStyle = tone; x.fillText(d.labels.verdict, P + 32, y - 2)

  // Score.
  y = 560
  x.font = `400 260px ${MONO}`; x.fillStyle = tone
  const s = String(d.score); x.fillText(s, P - 10, y)
  const sw = x.measureText(s).width
  x.font = `400 110px ${MONO}`; x.fillStyle = C.faint; x.fillText(`/${d.total}`, P - 10 + sw + 8, y)

  // Errors · max · time.
  const errs = d.marks.filter(m => m !== 'ok').length
  const t = d.secs != null ? `${Math.floor(d.secs / 60)}:${String(d.secs % 60).padStart(2, '0')}` : null
  x.font = `600 36px ${SANS}`; x.fillStyle = C.dim
  x.fillText([`${errs} ${d.labels.errors}`, d.labels.max, t && `${d.labels.time} ${t}`].filter(Boolean).join('  ·  '), P, y + 76)

  // Answer map: 10 × 3 squares.
  const top = 760, gap = 14, cols = 10
  const cw = (W - P * 2 - gap * (cols - 1)) / cols, ch = 84
  x.textAlign = 'center'; x.font = `400 26px ${MONO}`
  d.marks.forEach((m, i) => {
    const X = P + (i % cols) * (cw + gap), Y = top + Math.floor(i / cols) * (ch + gap)
    const c = m === 'ok' ? C.ok : m === 'wrong' ? C.bad : C.none
    if (m === 'none') { x.strokeStyle = c; x.lineWidth = 3; rr(x, X + 1.5, Y + 1.5, cw - 3, ch - 3, 12); x.stroke() }
    else { x.fillStyle = c + '26'; rr(x, X, Y, cw, ch, 12); x.fill() }
    x.fillStyle = c; x.fillText(String(i + 1), X + cw / 2, Y + ch / 2 + 9)
  })
  x.textAlign = 'left'

  // Footer.
  const fy = H - 110
  x.fillStyle = C.line; x.fillRect(P, fy - 58, W - P * 2, 2)
  x.fillStyle = C.brand; x.fillRect(P, fy - 58, 120, 4)
  x.font = `600 30px ${SANS}`; x.fillStyle = C.ink
  x.fillText(d.name ? d.name : 'Stradeo', P, fy)
  x.font = `400 24px ${SANS}`; x.fillStyle = C.dim
  x.fillText(d.labels.footer, P, fy + 40)
  x.font = `400 24px ${MONO}`; x.textAlign = 'right'; x.fillStyle = C.dim
  x.fillText('stradeo.quattroventi.xyz', W - P, fy)

  return new Promise((res, rej) => cv.toBlob(b => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'))
}
