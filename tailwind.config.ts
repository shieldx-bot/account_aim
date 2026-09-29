import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#08090C',
        surface: '#101318',
        elevated: '#181C24',
        'border-subtle': '#232936',
        'border-focus': '#0066FF',
        primary: {
          blue: '#0066FF',
          hover: '#257CFF',
        },
        accent: {
          cyan: '#00F0FF',
        },
        text: {
          primary: '#F3F4F6',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.25)',
        'glow-blue': '0 0 20px rgba(0, 102, 255, 0.35)',
        'card-hover': '0 12px 24px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'radar-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
