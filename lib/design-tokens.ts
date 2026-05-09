// CafeOps Design Tokens - Premium SaaS Aesthetic

export const colors = {
  // Primary Palette - Warm Coffee Tones
  primary: {
    50: '#FAF8F6',
    100: '#F5F1ED',
    200: '#EDE6DD',
    300: '#DFD0C0',
    400: '#C8B398',
    500: '#B0936D', // Primary coffee brown
    600: '#9B7B55',
    700: '#7D6344',
    800: '#665138',
    900: '#534136',
  },

  // Neutral Grayscale - Premium
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },

  // Status Colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Success green
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warning amber
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Error red
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Accent Colors
  accent: {
    blue: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    purple: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7',
      600: '#9333EA',
      700: '#7C3AED',
      800: '#6B21A8',
      900: '#581C87',
    },
  },
};

// Typography Scale
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

// Spacing Scale
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
};

// Border Radius
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: '0 0 20px rgb(176 147 109 / 0.3)',
  'glow-lg': '0 0 40px rgb(176 147 109 / 0.4)',
};

// Animation Durations
export const animations = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Component-specific tokens
export const components = {
  // Card styles
  card: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdrop: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    shadow: shadows.lg,
    borderRadius: borderRadius['2xl'],
  },

  // Button styles
  button: {
    primary: {
      background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
      shadow: shadows.md,
      borderRadius: borderRadius.xl,
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      shadow: shadows.sm,
    },
  },

  // Status badges
  status: {
    completed: colors.success[500],
    pending: colors.warning[500],
    overdue: colors.error[500],
    review: colors.accent.blue[500],
  },
};

// Dark mode tokens
export const darkMode = {
  background: {
    primary: '#0A0A0A',
    secondary: '#171717',
    tertiary: '#262626',
    card: 'rgba(40, 40, 40, 0.8)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A3A3A3',
    tertiary: '#737373',
  },
  border: {
    primary: 'rgba(255, 255, 255, 0.1)',
    secondary: 'rgba(255, 255, 255, 0.05)',
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  components,
  darkMode,
};
