/**
 * ProgressBar — thin track under the percent label.
 */
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

type Props = {
  percent: number;
};

export function ProgressBar({ percent }: Props) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
});
