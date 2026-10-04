// What kind of email link opened the app, read once at load before the Supabase
// client removes the token from the address bar. Supabase sends invite and reset
// links to the redirect URL, or to the site root when that URL isn't allowed, so
// the app routes them itself (see AuthLinkRouter).
export type AuthLinkType = 'invite' | 'recovery' | 'signup' | 'magiclink' | null

function read(): { type: AuthLinkType; error: boolean } {
  if (typeof window === 'undefined') return { type: null, error: false }
  const p = new URLSearchParams(window.location.hash.slice(1) + '&' + window.location.search.slice(1))
  const type = p.get('type') as AuthLinkType
  return { type: type || null, error: !!(p.get('error') || p.get('error_code')) }
}

export const AUTH_LINK = read()

/** True when running as an installed app (Home Screen), not in a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true
}

export function devicePlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}
