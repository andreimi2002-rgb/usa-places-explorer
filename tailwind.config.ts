import type { Config } from 'tailwindcss';

/**
 * Design tokens for the "Modern Geographic Atlas" look.
 * Every color, font, size and spacing value used in components comes from here.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        navy: {
          50: '#EEF2F8',
          100: '#D9E1EE',
          200: '#B3C2DB',
          300: '#7F96BD',
          500: '#2F4A78',
          700: '#17325C',
          800: '#112847',
          900: '#0E2240',
          950: '#081629',
        },
        // Text colors. All meet 4.5:1 on paper and white.
        ink: {
          DEFAULT: '#14181F',
          muted: '#4A5363',
          subtle: '#5B6474',
        },
        paper: {
          DEFAULT: '#F7F5F0',
          white: '#FFFFFF',
          sunk: '#EFECE4',
        },
        line: {
          DEFAULT: '#DDD8CC',
          strong: '#C4BEAE',
          dark: '#2A3F63',
        },
        // Gold accent: used sparingly. `gold.ink` is the text-safe shade.
        gold: {
          DEFAULT: '#C9A85A',
          soft: '#F3EBD6',
          ink: '#7A5C17',
        },
        status: {
          verified: '#1E6B47',
          'verified-bg': '#E5F2EA',
          partial: '#8A5A00',
          'partial-bg': '#FBF0D9',
          unverified: '#8E2F2F',
          'unverified-bg': '#F8E6E4',
        },
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        caption: ['0.75rem', { lineHeight: '1.1rem', letterSpacing: '0.01em' }],
        small: ['0.875rem', { lineHeight: '1.35rem' }],
        body: ['1rem', { lineHeight: '1.6rem' }],
        lead: ['1.1875rem', { lineHeight: '1.85rem' }],
        h4: ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '-0.005em' }],
        h3: ['1.375rem', { lineHeight: '1.8rem', letterSpacing: '-0.01em' }],
        h2: ['1.875rem', { lineHeight: '2.3rem', letterSpacing: '-0.015em' }],
        h1: ['2.5rem', { lineHeight: '2.9rem', letterSpacing: '-0.02em' }],
        display: ['3.5rem', { lineHeight: '3.8rem', letterSpacing: '-0.025em' }],
        eyebrow: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
      },
      spacing: {
        gutter: '1rem',
        'gutter-lg': '2rem',
        section: '4rem',
        'section-lg': '6rem',
      },
      maxWidth: {
        content: '76rem',
        prose: '42rem',
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '5px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(14, 34, 64, 0.06)',
        raised: '0 8px 24px -12px rgba(14, 34, 64, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
