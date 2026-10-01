import type { Config } from 'tailwindcss';

/*
 * Design system — Stripe-inspired light theme.
 * Palette follows Stripe's public brand guidelines:
 *   canvas #FFFFFF, surface #F6F9FC, navy text #0A2540,
 *   blurple primary #635BFF, cyan accent #00D4FF.
 * All color pairs used for text/background meet WCAG 2.1 AA (>= 4.5:1 body, >= 3:1 large).
 */
const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        surface: '#F6F9FC',
        'surface-subtle': '#EEF2F7',
        elevated: '#FFFFFF',
        'border-subtle': '#E3E8EE',
        'border-focus': '#635BFF',
        primary: {
          blue: '#635BFF',
          hover: '#7A73FF',
        },
        accent: {
          // Darkened cyan so text passes WCAG AA (5.6:1) on white; bright #00D4FF stays for glows/borders
          cyan: '#0E7490',
        },
        text: {
          primary: '#0A2540',
          secondary: '#425466',
          muted: '#5B6B7E',
        },
        status: {
          success: '#047857',
          warning: '#B45309',
          error: '#DF1B41',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        // Stripe-style layered soft shadows (light theme)
        'card-hover': '0 13px 27px -5px rgba(50, 50, 93, 0.18), 0 8px 16px -8px rgba(0, 0, 0, 0.14)',
        'card-rest': '0 2px 5px -1px rgba(50, 50, 93, 0.12), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'button': '0 4px 14px rgba(99, 91, 255, 0.35)',
        'glow-cyan': '0 0 24px rgba(0, 212, 255, 0.35)',
        'glow-blue': '0 4px 20px rgba(99, 91, 255, 0.3)',
        'nav': '0 1px 0 rgba(227, 232, 238, 1), 0 8px 24px -12px rgba(10, 37, 64, 0.08)',
      },
      animation: {
        'radar-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        heroFloat: 'heroFloat 6s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite alternate',
        gridPan: 'gridPan 30s linear infinite',
      },
      keyframes: {
        heroFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        aurora: {
          '0%': { transform: 'translateX(-10%) scale(1)', opacity: '0.35' },
          '50%': { transform: 'translateX(8%) scale(1.15)', opacity: '0.55' },
          '100%': { transform: 'translateX(-4%) scale(1.05)', opacity: '0.4' },
        },
        gridPan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '60px 60px' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
