/**
 * Student live classes module.
 *
 * modules/live-classes/
 *   components/LiveClassCard.tsx — LIVE NOW / countdown UI
 *   hooks/useLiveClassesQuery.ts
 *   screens/LiveClassesScreen.tsx
 *   utils/formatLiveTime.ts
 *
 * API: GET /live-classes/public
 * Join: open YouTube app / browser via openInYouTubeApp
 */
export { LiveClassCard } from './components/LiveClassCard';
export { LiveClassesScreen } from './screens/LiveClassesScreen';
export { useLiveClassesQuery } from './hooks/useLiveClassesQuery';
export { formatCountdown, formatStartTime } from './utils/formatLiveTime';
