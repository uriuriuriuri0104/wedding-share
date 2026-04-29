import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1C2E5A',
          dark: '#12203E',
          light: '#243669',
        },
        terracotta: {
          DEFAULT: '#B8623F',
          light: '#CC7A58',
          dark: '#9A4E2E',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#DFC070',
          dark: '#A88830',
          faint: 'rgba(201,168,76,0.15)',
        },
        cream: {
          DEFAULT: '#F5EFE0',
          light: '#FAF7F0',
          dark: '#EDE4CF',
        },
        stone: {
          DEFAULT: '#8C7D6E',
          light: '#A89888',
        },
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-lato)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.3em',
        widest3: '0.5em',
      },
    },
  },
  plugins: [],
}

export default config
