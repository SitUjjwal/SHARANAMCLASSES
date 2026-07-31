/**
 * CourseDetailSkeleton — first-load placeholders for detail screen.
 */
import { StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { spacing } from '@/theme';

export function CourseDetailSkeleton() {
  return (
    <View style={styles.wrap}>
      <SkeletonBlock height={240} radius={0} />
      <View style={styles.body}>
        <SkeletonBlock height={28} width="80%" radius={8} />
        <SkeletonBlock height={16} width="45%" radius={6} />
        <SkeletonBlock height={72} radius={8} />
        <SkeletonBlock height={48} radius={10} />
        <SkeletonBlock height={120} radius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
