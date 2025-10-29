import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: 'rgb(129 230 56)', // your lime for magic-link text etc.
        'okx-bg': '#0B0C10',
        'okx-surface': '#0F1115',
        'okx-border': '#1B1E24',
        'okx-text': '#E6E8EC',
        'okx-sub': '#9BA3AF',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        glow: '0 0 0 4px rgb(184 255 0 / 0.12)',
      },
    },
  },
  plugins: [],
}

export default config
