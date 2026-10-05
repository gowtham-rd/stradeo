// Stradeo service worker — makes the app installable and lets practice work offline.
// Bump VERSION to drop old caches after a release that changes cached files' format.
const VERSION = 'v23'
const SHELL = `stradeo-shell-${VERSION}`
const DATA = `stradeo-data-${VERSION}`
// Sign images never change between releases: their own cache, kept across versions.
const SIGNS = 'stradeo-signs-1'

// App pages and the question/lesson data needed to practise offline.
const PRECACHE = [
  '/', '/quiz', '/topic', '/exam', '/exam/review', '/login', '/privacy', '/settings',
  '/data/questions.json', '/data/theory_lessons.json',
  '/data/lessons/it.json', '/data/lessons/ta.json', '/data/lessons/hi.json',
  ...Array.from({ length: 25 }, (_, i) => `/data/topics/${i + 1}.json`),
]

self.addEventListener('install', event => {
  // Cache each file on its own so one missing file doesn't block installation.
  event.waitUntil(
    caches.open(SHELL)
      .then(c => Promise.allSettled(PRECACHE.map(url => c.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== DATA && k !== SIGNS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(cacheSigns),
  )
})

// All road sign images (~2.5 MB), downloaded once in the background after
// install, so a question seen for the first time offline still shows its sign.
async function cacheSigns() {
  try {
    const list = await (await fetch('/data/signs.json')).json()
    const cache = await caches.open(SIGNS)
    const urls = list.map(f => `/images/signs/${f}`)
    for (let i = 0; i < urls.length; i += 20) {
      await Promise.allSettled(urls.slice(i, i + 20).map(async u => {
        if (await cache.match(u)) return
        const res = await fetch(u)
        if (res.ok) await cache.put(u, res)
      }))
    }
  } catch { /* offline or list missing: signs still cache one by one as they're seen */ }
}

self.addEventListener('fetch', event => {
  const req = event.request
  const url = new URL(req.url)
  // Only same-origin GETs. Supabase, the AI routes and anything else go straight to the network.
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  // Pages: network first (fresh code), fall back to the cached page when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone()
        caches.open(SHELL).then(c => c.put(url.pathname, copy))
        return res
      }).catch(() => caches.match(url.pathname).then(r => r || caches.match('/'))),
    )
    return
  }

  // Build assets are content-hashed: cache first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone()
      caches.open(SHELL).then(c => c.put(req, copy))
      return res
    })))
    return
  }

  // Question data, lessons, sign images, icons: serve from cache, refresh in the background.
  if (/^\/(data|images|icons|logo)\//.test(url.pathname)) {
    event.respondWith(caches.open(DATA).then(async cache => {
      const hit = (await cache.match(req)) || (await caches.match(req))
      if (hit && url.pathname.startsWith('/images/signs/')) return hit // signs don't change
      // Revalidate with the server (not the browser's own cache), so updates arrive.
      const refresh = fetch(req, { cache: 'no-cache' }).then(res => { if (res.ok) cache.put(req, res.clone()); return res })
      if (hit) { refresh.catch(() => {}); return hit }
      return refresh
    }))
  }
})
