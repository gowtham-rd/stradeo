'use client'
import { useEffect, useState } from 'react'
import { localDay } from './plan'

/** Today's local date (YYYY-MM-DD), kept current: it updates at midnight and whenever
 *  the app comes back into view, so "today" never sticks on yesterday. Null until
 *  mounted, so server and client markup match. */
export function useToday(): string | null {
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const update = () => {
      setToday(localDay())
      clearTimeout(timer)
      const next = new Date(); next.setHours(24, 0, 1, 0)
      timer = setTimeout(update, next.getTime() - Date.now())
    }
    update()
    const onShow = () => { if (document.visibilityState === 'visible') update() }
    document.addEventListener('visibilitychange', onShow)
    window.addEventListener('focus', update)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onShow); window.removeEventListener('focus', update) }
  }, [])
  return today
}
