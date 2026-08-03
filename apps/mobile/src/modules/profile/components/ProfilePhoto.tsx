/**
 * ProfilePhoto — circular avatar from avatar_url, or initials fallback.
 * Uses expo-image memory+disk cache for remote avatars.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { colors } from '@/theme';

type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0] ?? '';
  const second = parts[1] ?? '';
  if (!second) return first.slice(0, 2).toUpperCase() || '?';
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase() || '?';
}

export function ProfilePhoto({ name, avatarUrl, size = 88 }: Props) {
  const radius = size / 2;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={avatarUrl}
        accessibilityLabel={`${name} profile photo`}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
      ]}
      accessibilityLabel={`${name} initials`}
    >
      <Text style={[styles.initials, { fontSize: Math.max(12, Math.round(size * 0.36)) }]}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  initials: {
    color: colors.primary,
    fontWeight: '800',
  },
});
