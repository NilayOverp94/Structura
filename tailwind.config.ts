import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          dark: '#0F172A',
          muted: '#64748B',
          light: '#E2E8F0',
        },
        surface: {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          tertiary: 'var(--surface-tertiary)',
          elevated: 'var(--surface-elevated)',
        },
        border: {
          DEFAULT: 'var(--border)',
          light: 'var(--border-light)',
          focus: '#3B82F6',
        },
        txt: {
          primary: 'var(--txt-primary)',
          secondary: 'var(--txt-secondary)',
          muted: 'var(--txt-muted)',
        },
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          purple: '#8B5CF6',
          'purple-hover': '#7C3AED',
          muted: 'rgba(59, 130, 246, 0.15)',
        },
        status: {
          success: '#22C55E',
          'success-muted': 'rgba(34, 197, 94, 0.15)',
          warning: '#F59E0B',
          'warning-muted': 'rgba(245, 158, 11, 0.15)',
          error: '#EF4444',
          'error-muted': 'rgba(239, 68, 68, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
