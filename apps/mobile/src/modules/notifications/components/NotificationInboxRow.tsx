/**
 * Notification Center row — emoji + title + subject (matches student mock).
 *
 * Today
 * 🔴 Live Class Started
 * Physics
 */
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  notificationSubtitle,
  notificationTypeEmoji,
} from '@/modules/notifications/utils/groupByDate';
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
  showDivider = false,
}: Props) {
  const emoji = notificationTypeEmoji(item.notification_type);
  const subtitle = notificationSubtitle(item);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        onPress={() => onPress(item)}
        style={({ pressed }) => [
          styles.row,
          !item.is_read ? styles.unread : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.emoji} accessibilityLabel={item.notification_type}>
          {emoji}
        </Text>

        <View style={styles.body}>
          <Text
            style={[styles.title, !item.is_read ? styles.titleUnread : null]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
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
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </Pressable>
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  unread: {
    backgroundColor: 'rgba(201,162,39,0.08)',
    borderRadius: 12,
    marginHorizontal: -spacing.xs,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
    width: 32,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  titleUnread: {
    fontWeight: '700',
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
  },
  deleteBtn: {
    padding: spacing.xs,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginLeft: 32 + spacing.md,
  },
});
