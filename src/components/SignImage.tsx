'use client'
import { useEffect, useRef, useState } from 'react'

// Road-sign image that never jumps: a fixed-height box with a soft placeholder,
// and the sign fades in once it has decoded.
export default function SignImage({ src, alt, height = 160, className = '' }: { src: string; alt: string; height?: number; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  const img = useRef<HTMLImageElement>(null)
  useEffect(() => {
    setLoaded(false)
    const el = img.current
    if (el?.complete && el.naturalWidth > 0) setLoaded(true) // from cache: no fade needed
  }, [src])
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ height }}>
      <div className={`absolute inset-y-0 w-[70%] max-w-[220px] rounded-[10px] bg-stradeo-surface2 transition-opacity duration-300 ${loaded ? 'opacity-0' : 'opacity-100 animate-pulse'}`} aria-hidden="true" />
      <img ref={img} src={src} alt={alt} decoding="async" onLoad={() => setLoaded(true)}
        className={`relative max-h-full max-w-full rounded-[10px] border border-stradeo-line object-contain transition-[opacity,transform] duration-300 ease-out ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'}`} />
    </div>
  )
}

/** Start downloading sign images ahead of time (e.g. the next exam questions). */
export function preloadImages(urls: (string | null | undefined)[]) {
  for (const u of urls) if (u) { const i = new Image(); i.decoding = 'async'; i.src = u }
}
