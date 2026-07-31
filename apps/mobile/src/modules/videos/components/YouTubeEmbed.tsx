/**
 * In-app YouTube player via react-native-youtube-iframe (WebView).
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import { colors } from '@/theme';

type YouTubeEmbedProps = {
  videoId: string;
  playing: boolean;
  onReady?: () => void;
  onError?: (message: string) => void;
  onPlayingChange?: (playing: boolean) => void;
};

export function YouTubeEmbed({
  videoId,
  playing,
  onReady,
  onError,
  onPlayingChange,
}: YouTubeEmbedProps) {
  const [ready, setReady] = useState(false);

  const handleReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);

  const handleChangeState = useCallback(
    (state: string) => {
      if (state === 'playing') onPlayingChange?.(true);
      if (state === 'paused' || state === 'ended') onPlayingChange?.(false);
    },
    [onPlayingChange],
  );

  const handleError = useCallback(
    (error: string) => {
      onError?.(error || 'YouTube player failed to load');
    },
    [onError],
  );

  return (
    <View style={styles.wrap}>
      {!ready ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : null}
      <YoutubePlayer
        height={220}
        play={playing}
        videoId={videoId}
        onReady={handleReady}
        onChangeState={handleChangeState}
        onError={handleError}
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
