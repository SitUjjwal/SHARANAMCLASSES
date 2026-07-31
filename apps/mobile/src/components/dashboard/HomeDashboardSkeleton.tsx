/**
 * HomeDashboardSkeleton — placeholders matching Home section order.
 */
import { StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { spacing } from '@/theme';

export function HomeDashboardSkeleton() {
  return (
    <View style={styles.wrap}>
      <SkeletonBlock height={32} width="75%" radius={8} />
      <SkeletonBlock height={18} width="40%" />
      <SkeletonBlock height={96} radius={16} />
      <SkeletonBlock height={18} width="35%" />
      <SkeletonBlock height={160} radius={16} />
      <SkeletonBlock height={18} width="30%" />
      <View style={styles.row}>
        <SkeletonBlock height={64} width="48%" radius={14} />
        <SkeletonBlock height={64} width="48%" radius={14} />
      </View>
      <View style={styles.row}>
        <SkeletonBlock height={64} width="48%" radius={14} />
        <SkeletonBlock height={64} width="48%" radius={14} />
      </View>
      <SkeletonBlock height={18} width="45%" />
      <View style={styles.row}>
        <SkeletonBlock height={160} width={200} radius={14} />
        <SkeletonBlock height={160} width={200} radius={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
