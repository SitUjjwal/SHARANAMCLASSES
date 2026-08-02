/**
 * Adaptive color palettes for Dark / Light mode (Settings → Dark Mode).
 * Legacy `colors` export stays brand tokens for screens not yet migrated.
 */
export type AppPalette = {
  canvas: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  danger: string;
  success: string;
  switchTrackOn: string;
  switchTrackOff: string;
  statusBarStyle: 'light' | 'dark';
};

export const darkPalette: AppPalette = {
  canvas: '#0B1F3A',
  card: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A8B3C5',
  accent: '#C9A227',
  danger: '#F28B82',
  success: '#81C784',
  switchTrackOn: '#C9A227',
  switchTrackOff: 'rgba(255,255,255,0.25)',
  statusBarStyle: 'light',
};

export const lightPalette: AppPalette = {
  canvas: '#F5F7FA',
  card: '#FFFFFF',
  cardBorder: '#D8DEE8',
  textPrimary: '#0B1F3A',
  textSecondary: '#5A6B82',
  accent: '#C9A227',
  danger: '#C62828',
  success: '#2E7D32',
  switchTrackOn: '#C9A227',
  switchTrackOff: '#C5CDD8',
  statusBarStyle: 'dark',
};
