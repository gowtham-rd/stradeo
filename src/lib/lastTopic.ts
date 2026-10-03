// The topic the user last opened (study or quiz), kept on this device for the
// home screen's "Continue studying" button.
const KEY = 'stradeo-last-topic'

export function getLastTopic(): number | null {
  try {
    const n = Number(localStorage.getItem(KEY))
    return Number.isInteger(n) && n >= 1 && n <= 25 ? n : null
  } catch { return null }
}

export function setLastTopic(id: number) {
  try { if (Number.isInteger(id) && id >= 1 && id <= 25) localStorage.setItem(KEY, String(id)) } catch { /* storage blocked */ }
}
