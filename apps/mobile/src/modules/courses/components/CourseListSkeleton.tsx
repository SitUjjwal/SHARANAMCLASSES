/**
 * Course list loading placeholders (grid of skeleton cards).
 */
import { StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { spacing } from '@/theme';

export function CourseListSkeleton() {
  return (
    <View style={styles.wrap}>
      {[0, 1, 2, 3].map((key) => (
        <View key={key} style={styles.card}>
          <SkeletonBlock height={120} radius={0} />
          <View style={styles.body}>
            <SkeletonBlock height={16} radius={6} />
            <SkeletonBlock height={12} width="60%" radius={6} />
            <SkeletonBlock height={18} width="35%" radius={6} />
            <SkeletonBlock height={14} width="45%" radius={6} />
            <SkeletonBlock height={32} radius={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  body: {
    gap: spacing.sm,
    padding: spacing.md,
  },
});
