/**
 * Videos module public API.
 *
 * Architecture
 * ------------
 * modules/videos/
 *   components/VideoPoster.tsx   — thumbnail + Play CTA
 *   components/YouTubeEmbed.tsx  — react-native-youtube-iframe wrapper
 *   screens/VideoPlayerScreen.tsx
 *   utils/youtube.ts             — extract video id / default thumbnail
 *   utils/openYouTube.ts         — native YouTube app fallback
 *   utils/formatVideoDuration.ts
 *
 * Data flow
 * ---------
 * ChapterContent taps a video → navigate VideoPlayer { courseId, chapterId, videoId }
 * Screen reads cached GET /courses/:id/chapters/:chapterId (videos[])
 * Teacher name comes from GET /courses/:id (teacher_name)
 *
 * Playback
 * --------
 * 1. Poster shows thumbnail until user taps Play
 * 2. NetInfo checks connectivity → network error UI if offline
 * 3. Embed mounts via WebView (react-native-youtube-iframe)
 * 4. On embed error → Retry + Open in YouTube app (vnd.youtube / youtube://)
 *
 * No binary video is stored — only YouTube URLs from PostgreSQL.
 */
export { VideoPlayerScreen } from './screens/VideoPlayerScreen';
export { VideoPoster } from './components/VideoPoster';
export { YouTubeEmbed } from './components/YouTubeEmbed';
export { extractYouTubeVideoId, youtubeThumbnailUrl } from './utils/youtube';
export { openInYouTubeApp } from './utils/openYouTube';
export { formatVideoDuration } from './utils/formatVideoDuration';
