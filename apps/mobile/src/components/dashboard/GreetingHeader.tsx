/**
 * GreetingHeader — “Good Morning Ujjwal 👋”
 * Why: warm personal open for the Home dashboard.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type GreetingHeaderProps = {
  name: string;
};

function greetingLabel(hour: number): string {
  if (hour < 12) {
    return 'Good Morning';
  }
  if (hour < 17) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
}

export function GreetingHeader({ name }: GreetingHeaderProps) {
  const firstName = name.trim().split(/\s+/)[0] || 'Student';
  const label = greetingLabel(new Date().getHours());

  return (
    <View style={styles.wrap}>
      <Text style={styles.hello}>
        {label} {firstName} 👋
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.sm,
  },
  hello: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
