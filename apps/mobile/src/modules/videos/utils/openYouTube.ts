/**
 * Prefer native YouTube app; fall back to https watch URL.
 * Why: embedding can fail (WebView / network / restricted); students still need access.
 */
import { Linking, Platform } from 'react-native';

type OpenYouTubeOptions = {
  youtubeUrl: string;
  videoId: string;
};

export async function openInYouTubeApp({
  youtubeUrl,
  videoId,
}: OpenYouTubeOptions): Promise<void> {
  const httpsUrl = youtubeUrl.startsWith('http')
    ? youtubeUrl
    : `https://www.youtube.com/watch?v=${videoId}`;

  const candidates =
    Platform.OS === 'ios'
      ? [`youtube://www.youtube.com/watch?v=${videoId}`, httpsUrl]
      : Platform.OS === 'android'
        ? [`vnd.youtube:${videoId}`, httpsUrl]
        : [httpsUrl];

  for (const url of candidates) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // try next candidate
    }
  }

  await Linking.openURL(httpsUrl);
}
