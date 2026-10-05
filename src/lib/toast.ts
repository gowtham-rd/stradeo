// Small confirmations shown as the top pill (same place as the offline pill).
// toast({ tone: 'ok', title: 'Name saved', note: 'Marco' })
export type Toast = { tone: 'ok' | 'error'; title: string; note?: string; /** How long it stays, ms (default 2200). */ ms?: number }
export const TOAST_EVENT = 'stradeo:toast'
export function toast(t: Toast) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<Toast>(TOAST_EVENT, { detail: t }))
}
