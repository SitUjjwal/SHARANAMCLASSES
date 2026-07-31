/**
 * Client-side YouTube URL helpers (mirror of API utils).
 * Why: extract video id for react-native-youtube-iframe without calling the API.
 */

const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (YT_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!YT_HOSTS.has(host)) return null;

  const v = url.searchParams.get('v');
  if (v && YT_ID_RE.test(v)) return v;

  const parts = url.pathname.split('/').filter(Boolean);
  if ((host === 'youtu.be' || host === 'www.youtu.be') && parts[0] && YT_ID_RE.test(parts[0])) {
    return parts[0];
  }

  const marker = parts.findIndex((p) => ['embed', 'live', 'shorts', 'v'].includes(p));
  if (marker >= 0) {
    const id = parts[marker + 1];
    if (id && YT_ID_RE.test(id)) return id;
  }

  return null;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function watchUrlForVideoId(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
