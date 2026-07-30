export const colors = {
  primary: '#0B1F3A',
  secondary: '#1E4D7B',
  accent: '#C9A227',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#0B1F3A',
  textMuted: '#5A6B82',
  border: '#D8DEE8',
  danger: '#C62828',
  success: '#2E7D32',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  fontSize: {
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
  },
} as const;

export const theme = {
  colors,
  spacing,
  typography,
} as const;

export type AppTheme = typeof theme;
