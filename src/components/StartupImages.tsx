import { SPLASH_DEVICES } from '@/lib/splashDevices'

// iOS launch screens for the home-screen app, light and dark, so a dark-mode
// phone never opens on a white flash.
export default function StartupImages() {
  return (
    <>
      {SPLASH_DEVICES.flatMap(([w, h, r]) => (['light', 'dark'] as const).map(theme => (
        <link key={`${w}-${h}-${r}-${theme}`} rel="apple-touch-startup-image"
          href={`/splash/${theme}-${w * r}x${h * r}.png`}
          media={`(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait) and (prefers-color-scheme: ${theme})`} />
      )))}
    </>
  )
}
