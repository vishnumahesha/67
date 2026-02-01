export const colors = {
  // Primary palette - warm champagne and rose gold
  primary: '#D4A574',
  primaryDark: '#C49464',
  primaryLight: '#E8C8A4',
  primaryGlow: 'rgba(212, 165, 116, 0.35)',

  // Accent - soft blush rose
  accent: '#E8B4B8',
  accentLight: '#F2CED0',
  accentGlow: 'rgba(232, 180, 184, 0.35)',

  // Secondary accent - warm mauve
  rose: '#C9A4A8',
  roseLight: '#DEC4C8',

  // Secondary color (for medium confidence, etc.)
  secondary: '#B8A4A0',
  secondaryLight: '#D4C8C4',

  // Background - rich warm charcoal
  background: '#0F0D0B',
  backgroundSecondary: '#161412',
  backgroundTertiary: '#1E1A18',
  surface: '#252120',
  surfaceLight: '#302A28',
  surfaceHighlight: '#3A3230',

  // Text - warm ivory and cream
  text: '#F5F0E8',
  textSecondary: '#C4B8A8',
  textMuted: '#8A7E70',
  textAccent: '#E8D4C0',

  // Status colors - softer, more elegant
  success: '#9DB88C',
  successLight: '#B8D0A8',
  warning: '#D4B078',
  warningLight: '#E8C898',
  error: '#C98888',
  errorLight: '#E0A8A8',
  info: '#A8B8C8',

  // Rating colors (gradient from low to high) - softer tones
  rating: {
    low: '#C98888', // 0-3
    medium: '#D4B078', // 4-6
    good: '#9DB88C', // 7-8
    excellent: '#D4A574', // 9-10
  },

  // Borders - warm undertones
  border: 'rgba(244, 240, 232, 0.06)',
  borderLight: 'rgba(244, 240, 232, 0.10)',
  borderAccent: 'rgba(212, 165, 116, 0.25)',

  // Overlays
  overlay: 'rgba(15, 13, 11, 0.85)',
  overlayLight: 'rgba(15, 13, 11, 0.6)',

  // Gradients (as arrays for LinearGradient)
  gradients: {
    primary: ['#D4A574', '#C49464'],
    accent: ['#E8B4B8', '#D4A4A8'],
    dark: ['#161412', '#0F0D0B'],
    surface: ['#252120', '#1E1A18'],
    glow: ['rgba(212, 165, 116, 0.15)', 'rgba(212, 165, 116, 0)'],
    rating: ['#9DB88C', '#D4A574'],
    luxury: ['#D4A574', '#E8B4B8', '#C49464'],
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  // Using system fonts with fallbacks - in production would use custom fonts
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 32,
    display: 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#0F0D0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F0D0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F0D0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
  },
};
