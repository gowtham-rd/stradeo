import plugin from 'tailwindcss/plugin'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        stradeo: {
          bg: 'rgb(var(--bg) / <alpha-value>)',
          bg2: 'rgb(var(--surface) / <alpha-value>)',
          surface2: 'rgb(var(--surface-2) / <alpha-value>)',
          line: 'rgb(var(--line) / <alpha-value>)',
          nav: 'rgb(var(--nav) / 0.92)',
          ink: 'rgb(var(--ink) / <alpha-value>)',
          inkdim: 'rgb(var(--ink-dim) / <alpha-value>)',
          inkfaint: 'rgb(var(--ink-faint) / <alpha-value>)',
          // Brand: yellow fill for the one main action per view; text on it is onbrand.
          brand: 'rgb(var(--brand) / <alpha-value>)',
          brandorange: 'rgb(var(--stradeo) / <alpha-value>)',
          onbrand: 'rgb(var(--on-brand) / <alpha-value>)',
          // Status colours (kept under their old names so components didn't need renaming).
          accent: 'rgb(var(--warning) / <alpha-value>)', // warning — orange
          accent2: 'rgb(var(--danger) / <alpha-value>)', // danger / wrong — red
          green: 'rgb(var(--success) / <alpha-value>)', // success / correct
          blue: 'rgb(var(--info) / <alpha-value>)', // info — translations, review
        },
      },
      fontFamily: {
        sans: ['"Titillium Web"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      // One motion language: ease-out curve, 160 / 240 / 360 ms (see globals.css).
      animation: {
        'fade-in': 'fadeIn 0.24s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'fade-in-up': 'fadeInUp 0.36s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'spin-slow': 'spin 0.8s linear infinite',
        'pulse-green': 'pulseGreen 0.4s',
        'shake': 'shake 0.3s',
        'page-in': 'pageIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'page-forward': 'slideFromRightSoft 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'page-back': 'slideFromLeftSoft 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'slide-from-right': 'slideFromRight 0.26s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'slide-from-left': 'slideFromLeft 0.26s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'sheet-up': 'sheetUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'backdrop-in': 'backdropIn 0.2s ease both',
        'rise': 'rise 0.36s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'grow-x': 'growX 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'grow-y': 'growY 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'conn-in': 'connIn 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'pop': 'pop 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
      },
      keyframes: {
        connIn: {
          from: { opacity: '0', transform: 'translateY(-14px) scale(0.92)' },
          to: { opacity: '1', transform: 'none' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGreen: {
          '0%': { borderColor: 'rgb(var(--success))' },
          '100%': { borderColor: 'rgb(var(--line))' },
        },
        pageIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        slideFromRightSoft: {
          from: { opacity: '0', transform: 'translateX(18px)' },
          to: { opacity: '1', transform: 'none' },
        },
        slideFromLeftSoft: {
          from: { opacity: '0', transform: 'translateX(-18px)' },
          to: { opacity: '1', transform: 'none' },
        },
        growX: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        growY: {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '70%': { opacity: '1', transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideFromRight: {
          from: { opacity: '0', transform: 'translateX(28px)' },
          to: { opacity: '1', transform: 'none' },
        },
        slideFromLeft: {
          from: { opacity: '0', transform: 'translateX(-28px)' },
          to: { opacity: '1', transform: 'none' },
        },
        sheetUp: {
          from: { opacity: '0', transform: 'translateY(24px) scale(0.98)' },
          to: { opacity: '1', transform: 'none' },
        },
        backdropIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [
    // `short:` — short screens (iPhone SE in Safari with its toolbars): tighter onboarding/login.
    plugin(({ addVariant }) => { addVariant('short', '@media (max-height: 600px)'); addVariant('roomy', '@media (min-height: 820px)') }),],
}
export default config
