/**
 * SkeletonBlock — lightweight loading placeholder.
 * Why: shared shimmer-less block used by section skeletons while data loads.
 */
import { StyleSheet, View, type ViewProps } from 'react-native';

import { spacing } from '@/theme';

type SkeletonBlockProps = ViewProps & {
  height?: number;
  width?: number | `${number}%`;
  radius?: number;
};

export function SkeletonBlock({
  height = 16,
  width = '100%',
  radius = 8,
  style,
  ...props
}: SkeletonBlockProps) {
  return (
    <View
      style={[
        styles.base,
        { height, width, borderRadius: radius },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.sm,
  },
});
