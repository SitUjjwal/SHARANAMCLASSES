/**
 * In-app YouTube player via react-native-youtube-iframe (WebView).
 * Supports resume (`startSeconds`) and 15s position polling for Continue Watching.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import YoutubePlayer, { type YoutubeIframeRef } from 'react-native-youtube-iframe';

import { colors } from '@/theme';

const PROGRESS_INTERVAL_MS = 15_000;

type YouTubeEmbedProps = {
  videoId: string;
  playing: boolean;
  /** Resume playback from this second (floor). */
  startSeconds?: number;
  onReady?: () => void;
  onError?: (message: string) => void;
  onPlayingChange?: (playing: boolean) => void;
  /** Fired ~every 15s while playing (and on pause/end) with current time + duration. */
  onProgress?: (positionSeconds: number, durationSeconds: number) => void;
};

export function YouTubeEmbed({
  videoId,
  playing,
  startSeconds = 0,
  onReady,
  onError,
  onPlayingChange,
  onProgress,
}: YouTubeEmbedProps) {
  const [ready, setReady] = useState(false);
  const playerRef = useRef<YoutubeIframeRef>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const reportProgress = useCallback(async () => {
    const player = playerRef.current;
    const cb = onProgressRef.current;
    if (!player || !cb) return;
    try {
      const [position, duration] = await Promise.all([
        player.getCurrentTime(),
        player.getDuration(),
      ]);
      cb(Number(position) || 0, Number(duration) || 0);
    } catch {
      // Player may be tearing down — ignore
    }
  }, []);

  useEffect(() => {
    if (!playing || !ready) return;

    void reportProgress();
    const timer = setInterval(() => {
      void reportProgress();
    }, PROGRESS_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [playing, ready, reportProgress]);

  const handleReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);

  const handleChangeState = useCallback(
    (state: string) => {
      if (state === 'playing') onPlayingChange?.(true);
      if (state === 'paused' || state === 'ended') {
        onPlayingChange?.(false);
        void reportProgress();
      }
    },
    [onPlayingChange, reportProgress],
  );

  const handleError = useCallback(
    (error: string) => {
      onError?.(error || 'YouTube player failed to load');
    },
    [onError],
  );

  const start = Math.max(0, Math.floor(startSeconds));

  return (
    <View style={styles.wrap}>
      {!ready ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : null}
      <YoutubePlayer
        ref={playerRef}
        height={220}
        play={playing}
        videoId={videoId}
        onReady={handleReady}
        onChangeState={handleChangeState}
        onError={handleError}
        initialPlayerParams={{
          start: start > 0 ? start : undefined,
          modestbranding: true,
          rel: false,
        }}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
