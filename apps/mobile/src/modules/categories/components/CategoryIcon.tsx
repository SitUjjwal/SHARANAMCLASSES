/**
 * CategoryIcon — dynamic icon from API `icon` field.
 * Why: supports Ionicons names OR emoji (📘) without hardcoding per category.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme';

type CategoryIconProps = {
  icon: string | null;
  size?: number;
};

function isIonicon(name: string | null): name is keyof typeof Ionicons.glyphMap {
  return Boolean(name && name in Ionicons.glyphMap);
}

export function CategoryIcon({ icon, size = 22 }: CategoryIconProps) {
  return (
    <View style={styles.wrap}>
      {isIonicon(icon) ? (
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
});
