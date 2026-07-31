/**
 * Course detail hero — full-bleed thumbnail + share + back.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

export type CourseDetailHeroProps = {
  thumbnailUrl: string | null;
  title: string;
  onBack: () => void;
  onShare: () => void;
};

export function CourseDetailHero({
  thumbnailUrl,
  title,
  onBack,
  onShare,
}: CourseDetailHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap}>
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      ) : (
        <View style={[styles.image, styles.fallback]}>
          <Text style={styles.fallbackLetter}>{title.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
      <View style={[styles.overlay, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={onBack}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.surface} />
        </Pressable>
        <Pressable
          onPress={onShare}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Share course"
        >
          <Ionicons name="share-outline" size={22} color={colors.surface} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 240,
    backgroundColor: colors.secondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLetter: {
    color: colors.accent,
    fontSize: 56,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,31,58,0.55)',
  },
});
