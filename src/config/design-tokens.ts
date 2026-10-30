export const tokens = {
  brand: {
    primary: '#3B82F6', // Electric Blue
    secondary: '#8B5CF6', // Vibrant Purple / Violet
    background: '#0F172A', // Slate 900 / Brand Dark
    text: '#64748B', // Slate 500 / Muted Brand Text
    border: '#E2E8F0', // Slate 200 / Brand Light Border
  },
  colors: {
    dark: {
      bg: {
        primary: '#0F172A',
        secondary: '#1E293B',
        tertiary: '#334155',
        elevated: '#1E293B',
      },
      border: {
        default: '#334155',
        light: '#475569',
        focus: '#3B82F6',
      },
      text: {
        primary: '#F8FAFC',
        secondary: '#94A3B8',
        muted: '#64748B',
      },
    },
    light: {
      bg: {
        primary: '#FFFFFF',
        secondary: '#F8FAFC',
        tertiary: '#F1F5F9',
        elevated: '#FFFFFF',
      },
      border: {
        default: '#E2E8F0',
        light: '#CBD5E1',
        focus: '#3B82F6',
      },
      text: {
        primary: '#0F172A',
        secondary: '#475569',
        muted: '#64748B',
      },
    },
    accent: {
      blue: '#3B82F6',
      purple: '#8B5CF6',
      blueHover: '#2563EB',
      purpleHover: '#7C3AED',
    },
    status: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
  fonts: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
  },
} as const;
