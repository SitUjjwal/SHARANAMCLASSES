/**
 * GreetingHeader — menu + Hello {name} + search + notifications bell.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

type GreetingHeaderProps = {
  name: string;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  unreadCount?: number;
};

export function GreetingHeader({
  name,
  onMenuPress,
  onSearchPress,
  onNotificationsPress,
  unreadCount = 0,
}: GreetingHeaderProps) {
  const firstName = name.trim().split(/\s+/)[0] || 'Student';
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
        Hello {firstName}
      </Text>

      {onSearchPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search courses"
          onPress={onSearchPress}
          style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]}
        >
          <Ionicons name="search" size={20} color={colors.surface} />
        </Pressable>
      ) : null}

      {onNotificationsPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
          onPress={onNotificationsPress}
          style={({ pressed }) => [
            styles.iconBtn,
            unreadCount > 0 ? styles.iconBtnActive : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons
            name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
            size={20}
            color={unreadCount > 0 ? colors.accent : colors.surface}
          />
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
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(201,162,39,0.16)',
    borderColor: 'rgba(201,162,39,0.35)',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
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
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '800',
  },
});
