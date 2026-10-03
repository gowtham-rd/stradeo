/** @type {import('next').NextConfig} */
// Question data and sign images rarely change: let browsers keep them for a day
// and refresh them in the background for a week, instead of re-downloading on every visit.
const STATIC_CACHE = 'public, max-age=86400, stale-while-revalidate=604800'

const nextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: require('./package.json').version },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      { source: '/data/:path*', headers: [{ key: 'Cache-Control', value: STATIC_CACHE }] },
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: STATIC_CACHE }] },
      // The service worker must always be fresh so updates roll out.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    ]
  },
}
module.exports = nextConfig
