export const tokens = {
  brand: {
    primary: '#FFFFFF', // Crisp White
    secondary: '#71717A', // Neutral Zinc
    background: '#090A0C', // Deep Charcoal Black
    text: '#A1A1AA', // Neutral Gray
    border: '#27272A', // Zinc Border
  },
  colors: {
    dark: {
      bg: {
        primary: '#090A0C',
        secondary: '#121316',
        tertiary: '#191A1E',
        elevated: '#15161A',
      },
      border: {
        default: '#22242A',
        light: '#2E3038',
        focus: '#52525B',
      },
      text: {
        primary: '#EDEDED',
        secondary: '#9B9DA6',
        muted: '#646670',
      },
    },
    light: {
      bg: {
        primary: '#FFFFFF',
        secondary: '#F8F9FA',
        tertiary: '#F1F3F5',
        elevated: '#FFFFFF',
      },
      border: {
        default: '#E4E5E8',
        light: '#D1D3D8',
        focus: '#27272A',
      },
      text: {
        primary: '#090A0C',
        secondary: '#5A5D66',
        muted: '#848792',
      },
    },
    accent: {
      monochrome: '#FFFFFF',
      monochromeHover: '#E4E4E7',
    },
    status: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#71717A',
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
