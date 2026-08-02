/**
 * GreetingHeader — menu + greeting + notifications bell (unread badge).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

type GreetingHeaderProps = {
  name: string;
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
  unreadCount?: number;
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

export function GreetingHeader({
  name,
  onMenuPress,
  onNotificationsPress,
  unreadCount = 0,
}: GreetingHeaderProps) {
  const firstName = name.trim().split(/\s+/)[0] || 'Student';
  const label = greetingLabel(new Date().getHours());
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <View style={styles.wrap}>
      {onMenuPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          onPress={onMenuPress}
          style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]}
        >
          <Ionicons name="menu" size={24} color={colors.surface} />
        </Pressable>
      ) : null}
      <Text style={styles.hello} numberOfLines={1}>
        {label} {firstName} 👋
      </Text>
      {onNotificationsPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
          onPress={onNotificationsPress}
          style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.surface} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
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
  iconBtn: {
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
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '700',
  },
});
