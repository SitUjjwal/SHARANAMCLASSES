/**
 * YouTube URL validation + video-id extraction.
 * Stores only the canonical URL / id in PostgreSQL — never video binaries.
 */
const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

/** Standard YouTube video id: 11 chars [A-Za-z0-9_-] */
const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export type ParsedYouTubeUrl = {
  /** Canonical watch URL */
  youtube_url: string;
  youtube_video_id: string;
};

function hostnameOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Extract an 11-char video id from common YouTube URL shapes:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (YT_ID_RE.test(trimmed)) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!YT_HOSTS.has(host)) {
    return null;
  }

  const v = url.searchParams.get('v');
  if (v && YT_ID_RE.test(v)) {
    return v;
  }

  const parts = url.pathname.split('/').filter(Boolean);
  // youtu.be/VIDEO_ID
  if ((host === 'youtu.be' || host === 'www.youtu.be') && parts[0] && YT_ID_RE.test(parts[0])) {
    return parts[0];
  }

  // /embed/ID /live/ID /shorts/ID /v/ID
  const marker = parts.findIndex((p) => ['embed', 'live', 'shorts', 'v'].includes(p));
  if (marker >= 0) {
    const id = parts[marker + 1];
    if (id && YT_ID_RE.test(id)) return id;
  }

  return null;
}

export function isValidYouTubeUrl(input: string): boolean {
  return extractYouTubeVideoId(input) !== null;
}

/**
 * Normalize any accepted YouTube URL to a canonical watch URL + id.
 * Throws Error with a clear message when invalid.
 */
export function parseYouTubeUrl(input: string): ParsedYouTubeUrl {
  const id = extractYouTubeVideoId(input);
  if (!id) {
    throw new Error(
      'Invalid YouTube URL. Use an unlisted/public watch, youtu.be, embed, live, or shorts link.',
    );
  }

  // Prefer the original URL if it was already a full https URL on a YouTube host;
  // otherwise canonicalize to watch?v=
  const trimmed = input.trim();
  const host = hostnameOf(trimmed);
  const youtube_url =
    host && YT_HOSTS.has(host) && trimmed.startsWith('http')
      ? trimmed.split('#')[0] ?? `https://www.youtube.com/watch?v=${id}`
      : `https://www.youtube.com/watch?v=${id}`;

  return { youtube_url, youtube_video_id: id };
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
