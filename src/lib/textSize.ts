// Text size: 5 steps, the middle one (index 2, 112%) is the default. Applied by scaling the whole
// page (CSS zoom) so every size in the app — including fixed pixel sizes — grows together.
export const TEXT_SCALES = [0.9, 1, 1.12, 1.25, 1.4] as const
export const DEFAULT_TEXT_STEP = 2
const KEY = 'stradeo-text-size'

export function readTextStep(): number {
  try {
    const n = Number(localStorage.getItem(KEY))
    return Number.isInteger(n) && n >= 0 && n < TEXT_SCALES.length && localStorage.getItem(KEY) !== null ? n : DEFAULT_TEXT_STEP
  } catch { return DEFAULT_TEXT_STEP }
}

export function applyTextStep(step: number) {
  const scale = TEXT_SCALES[step] ?? 1
  document.documentElement.style.setProperty('zoom', scale === 1 ? '' : String(scale))
  try {
    if (step === DEFAULT_TEXT_STEP) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, String(step))
  } catch { /* storage blocked */ }
}

/** Inline script for <head>: applies the saved size before first paint (no jump). */
export const noFlashTextSize = `try{var s=localStorage.getItem('${KEY}'),z=${JSON.stringify(TEXT_SCALES)}[s===null?${DEFAULT_TEXT_STEP}:+s];if(z&&z!==1)document.documentElement.style.zoom=z;}catch(e){}`
