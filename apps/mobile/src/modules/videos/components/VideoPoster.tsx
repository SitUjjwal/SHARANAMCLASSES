/**
 * Thumbnail + centered play CTA before the embed mounts.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

type VideoPosterProps = {
  thumbnailUrl: string | null;
  loading?: boolean;
  disabled?: boolean;
  onPlay: () => void;
};

export function VideoPoster({
  thumbnailUrl,
  loading = false,
  disabled = false,
  onPlay,
}: VideoPosterProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Play video"
      disabled={disabled || loading}
      onPress={onPlay}
      style={({ pressed }) => [styles.wrap, pressed && !disabled ? styles.pressed : null]}
    >
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={thumbnailUrl}
          transition={200}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <View style={styles.scrim} />
      <View style={styles.playWrap}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.surface} />
        ) : (
          <>
            <View style={styles.playBtn}>
              <Ionicons name="play" size={32} color={colors.primary} style={styles.playIcon} />
            </View>
            <Text style={styles.playLabel}>Play</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  pressed: {
    opacity: 0.92,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,31,58,0.35)',
  },
  playWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  playIcon: {
    marginLeft: 4,
  },
  playLabel: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
