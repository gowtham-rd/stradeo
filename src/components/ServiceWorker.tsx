'use client'
import { useEffect } from 'react'

// Registers /sw.js in production so Stradeo can be installed and used offline.
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => { /* not critical */ })
  }, [])
  return null
}
