/**
 * ProgressBar — horizontal fill for 0–100%.
 */
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

type Props = {
  percent: number;
  height?: number;
};

export function ProgressBar({ percent, height = 10 }: Props) {
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${pct}%`,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
});
