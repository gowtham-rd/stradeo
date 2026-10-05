'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

// Wraps every page and re-mounts on navigation, so pages move with the direction
// you go: deeper screens slide in from the right, going back slides in from the
// left, same-level and first loads ease in (fade + slight rise).
const DEPTH: Record<string, number> = {
  '/': 0, '/login': 0, '/welcome': 0, '/reset': 0,
  '/settings': 1, '/topic': 1, '/privacy': 1,
  '/quiz': 2, '/exam': 2,
  '/exam/review': 3,
}
let lastPath: string | null = null

export default function Template({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [motion] = useState(() => {
    if (typeof window === 'undefined') return 'animate-page-in' // server: same as first client paint
    const prev = lastPath
    lastPath = path
    if (prev === null || prev === path) return 'animate-page-in'
    const from = DEPTH[prev] ?? 1, to = DEPTH[path] ?? 1
    return to > from ? 'animate-page-forward' : to < from ? 'animate-page-back' : 'animate-page-in'
  })
  return <div className={`${motion} page-shift`}>{children}</div>
}
