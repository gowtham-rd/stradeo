import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        stradeo: {
          bg: 'var(--bg)',
          bg2: 'var(--surface)',
          surface2: 'var(--surface-2)',
          line: 'var(--line)',
          nav: 'var(--nav)',
          ink: 'var(--ink)',
          inkdim: 'var(--ink-dim)',
          inkfaint: 'var(--ink-faint)',
          accent: '#f97316',
          accent2: '#ef4444',
          green: '#22c55e',
          blue: '#818cf8',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'spin-slow': 'spin 0.8s linear infinite',
        'pulse-green': 'pulseGreen 0.3s',
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
          '0%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.4)' },
          '50%': { boxShadow: '0 0 0 14px rgba(34,197,94,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0)' },
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
