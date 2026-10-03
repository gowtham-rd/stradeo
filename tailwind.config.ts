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
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'spin-slow': 'spin 0.8s linear infinite',
        'pulse-green': 'pulseGreen 0.4s',
        'shake': 'shake 0.3s',
      },
      keyframes: {
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
  plugins: [],
}
export default config
