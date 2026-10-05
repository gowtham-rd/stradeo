'use client'
// Pass moment: ~18 small squares in the app's colours fly out from the verdict.
const COLORS = ['rgb(var(--success))', '#FFD600', 'rgb(var(--stradeo))', 'rgb(var(--success))', 'rgb(var(--ink))']
export default function PassBurst({ delay = 750 }: { delay?: number }) {
  const n = 18
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1)
        const d = 46 + (i % 3) * 22
        return (
          <span key={i} className="burst-piece" style={{
            background: COLORS[i % COLORS.length],
            ['--dx' as string]: `${Math.cos(a) * d * 1.6}px`, ['--dy' as string]: `${Math.sin(a) * d}px`,
            ['--r' as string]: `${(i % 2 ? 1 : -1) * (90 + i * 20)}deg`,
            width: i % 3 === 0 ? 10 : 7, height: i % 3 === 0 ? 5 : 7,
            animationDelay: `${delay + (i % 4) * 25}ms`,
          }} />
        )
      })}
    </span>
  )
}
