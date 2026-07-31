/**
 * CourseFeatures — bullet list of course benefits.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

export type CourseFeaturesProps = {
  features: string[];
};

export function CourseFeatures({ features }: CourseFeaturesProps) {
  if (!features.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Course Features</Text>
      <View style={styles.list}>
        {features.map((feature) => (
          <View key={feature} style={styles.row}>
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            <Text style={styles.text}>{feature}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  heading: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
});
