/** Format seconds as 45m / 1h 12m for chapter cards. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (!total) {
    return '—';
  }
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${Math.max(1, minutes)}m`;
}
