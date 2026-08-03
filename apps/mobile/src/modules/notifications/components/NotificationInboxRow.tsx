/**
 * Notification inbox row — card with type icon, unread accent, time.
 */
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  formatNotificationTime,
  notificationSubtitle,
  notificationTypeIcon,
} from '@/modules/notifications/utils/groupByDate';
import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';
import type { NotificationInboxItem } from '@sharanam/shared';

type Props = {
  item: NotificationInboxItem;
  onPress: (item: NotificationInboxItem) => void;
  onDelete: (item: NotificationInboxItem) => void;
  showDivider?: boolean;
};

export function NotificationInboxRow({
  item,
  onPress,
  onDelete,
}: Props) {
  const theme = useAppTheme();
  const isDark = theme.canvas === '#0B1F3A';
  const icon = notificationTypeIcon(item.notification_type);
  const subtitle = notificationSubtitle(item);
  const time = formatNotificationTime(item.created_at);
  const unread = !item.is_read;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: unread
            ? isDark
              ? 'rgba(201,162,39,0.12)'
              : 'rgba(201,162,39,0.1)'
            : theme.card,
          borderColor: unread
            ? 'rgba(201,162,39,0.35)'
            : theme.cardBorder,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {unread ? <View style={[styles.unreadBar, { backgroundColor: colors.accent }]} /> : null}

      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: unread
              ? 'rgba(201,162,39,0.2)'
              : isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(11,31,58,0.06)',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={unread ? colors.accent : theme.textSecondary}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                color: theme.textPrimary,
                fontWeight: unread ? '700' : '600',
              },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {unread ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
        </View>

        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : item.body ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}

        <Text style={[styles.time, { color: theme.textSecondary }]}>{time}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete notification"
        hitSlop={10}
        onPress={() => {
          Alert.alert('Delete notification?', 'This removes it from your inbox.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => onDelete(item),
            },
          ]);
        }}
        style={({ pressed }) => [
          styles.deleteBtn,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,31,58,0.05)',
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: 4,
    paddingTop: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.md,
    letterSpacing: -0.1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  time: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    opacity: 0.85,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
