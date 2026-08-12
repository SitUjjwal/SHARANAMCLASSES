/**
 * CategoryIcon — dynamic icon from API `icon` field.
 * Why: supports Ionicons names, emoji (📘), or an uploaded photo URL without hardcoding per category.
 */
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme';

type CategoryIconProps = {
  icon: string | null;
  size?: number;
};

function isIonicon(name: string | null): name is keyof typeof Ionicons.glyphMap {
  return Boolean(name && name in Ionicons.glyphMap);
}

function isImageUrl(icon: string | null): icon is string {
  return Boolean(icon && /^https?:\/\//i.test(icon.trim()));
}

export function CategoryIcon({ icon, size = 22 }: CategoryIconProps) {
  return (
    <View style={styles.wrap}>
      {isImageUrl(icon) ? (
        <Image source={{ uri: icon.trim() }} style={styles.photo} resizeMode="cover" />
      ) : isIonicon(icon) ? (
        <Ionicons name={icon} size={size} color={colors.accent} />
      ) : (
        <Text style={[styles.emoji, { fontSize: size }]}>{icon || '📘'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,162,39,0.15)',
  },
  emoji: {
    lineHeight: 28,
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
