/**
 * GreetingHeader — menu + “Good Morning Ujjwal 👋”
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

type GreetingHeaderProps = {
  name: string;
  onMenuPress?: () => void;
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

export function GreetingHeader({ name, onMenuPress }: GreetingHeaderProps) {
  const firstName = name.trim().split(/\s+/)[0] || 'Student';
  const label = greetingLabel(new Date().getHours());

  return (
    <View style={styles.wrap}>
      {onMenuPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          onPress={onMenuPress}
          style={({ pressed }) => [styles.menuBtn, pressed ? styles.pressed : null]}
        >
          <Ionicons name="menu" size={24} color={colors.surface} />
        </Pressable>
      ) : null}
      <Text style={styles.hello} numberOfLines={1}>
        {label} {firstName} 👋
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pressed: {
    opacity: 0.85,
  },
  hello: {
    flex: 1,
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
