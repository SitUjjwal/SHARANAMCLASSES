/**
 * NotificationCenterScreen — modern inbox hub.
 *
 * Unread badge, mark read, delete, pull-to-refresh, pagination, grouped by date.
 */
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { NotificationInboxRow } from '@/modules/notifications/components/NotificationInboxRow';
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/modules/notifications/hooks/useNotificationInboxMutations';
import { useNotificationHistoryInfiniteQuery } from '@/modules/notifications/hooks/useNotificationHistoryInfiniteQuery';
import { handleNotificationData } from '@/modules/notifications/handleNotificationResponse';
import { groupNotificationsByDate } from '@/modules/notifications/utils/groupByDate';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';
import type { NotificationInboxItem } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'NotificationCenter'>;

function NotificationsEmpty() {
  const theme = useAppTheme();
  const isDark = theme.canvas === '#0B1F3A';

  return (
    <View
      style={[
        styles.empty,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={styles.emptyGlow} pointerEvents="none">
        <View style={[styles.emptyOrb, { backgroundColor: colors.accent }]} />
      </View>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: isDark ? 'rgba(201,162,39,0.16)' : 'rgba(201,162,39,0.12)' },
        ]}
      >
        <Ionicons name="notifications-outline" size={28} color={colors.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        No notifications yet
      </Text>
      <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
        When we send announcements or reminders, they will show up here.
      </Text>
    </View>
  );
}

export function NotificationCenterScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const isDark = theme.canvas === '#0B1F3A';
  const historyQuery = useNotificationHistoryInfiniteQuery();
  const markRead = useMarkNotificationReadMutation();
  const markAll = useMarkAllNotificationsReadMutation();
  const remove = useDeleteNotificationMutation();

  const items = useMemo(
    () => historyQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [historyQuery.data?.pages],
  );
  const sections = useMemo(() => groupNotificationsByDate(items), [items]);
  const unreadCount = historyQuery.data?.pages[0]?.unreadCount ?? 0;

  async function onOpenItem(item: NotificationInboxItem) {
    if (!item.is_read) {
      try {
        await markRead.mutateAsync(item.id);
      } catch {
        // still allow navigation
      }
    }
    handleNotificationData({
      ...item.data,
      deepLink: item.deep_link ?? item.data.deepLink,
      type: item.notification_type,
      notification_type: item.notification_type,
    });
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
          <Text style={[styles.backLabel, { color: theme.textPrimary }]}>Back</Text>
        </Pressable>

        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Notifications</Text>
            {unreadCount > 0 ? (
              <View style={[styles.unreadChip, { backgroundColor: 'rgba(201,162,39,0.18)' }]}>
                <Text style={[styles.unreadChipText, { color: colors.accent }]}>
                  {unreadCount > 99 ? '99+' : unreadCount} new
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {unreadCount > 0
              ? 'Tap a notification to open it'
              : 'Updates, live classes, and test reminders'}
          </Text>
        </View>

        {unreadCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void markAll.mutateAsync();
            }}
            style={({ pressed }) => [
              styles.markAll,
              {
                backgroundColor: isDark ? 'rgba(201,162,39,0.14)' : 'rgba(201,162,39,0.12)',
                borderColor: 'rgba(201,162,39,0.35)',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={colors.accent} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {historyQuery.isLoading && !historyQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={92} radius={16} />
          <SkeletonBlock height={92} radius={16} />
          <SkeletonBlock height={92} radius={16} />
        </View>
      ) : null}

      {historyQuery.isError && !historyQuery.data ? (
        <ErrorState
          message={getApiErrorMessage(historyQuery.error)}
          onRetry={() => {
            void historyQuery.refetch();
          }}
        />
      ) : null}

      {historyQuery.data ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          SectionSeparatorComponent={() => <View style={styles.sectionSep} />}
          ItemSeparatorComponent={() => <View style={styles.itemSep} />}
          ListEmptyComponent={<NotificationsEmpty />}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <NotificationInboxRow
              item={item}
              onPress={(row) => {
                void onOpenItem(row);
              }}
              onDelete={(row) => {
                void remove.mutateAsync(row.id);
              }}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={historyQuery.isRefetching && !historyQuery.isFetchingNextPage}
              onRefresh={() => {
                void historyQuery.refetch();
              }}
              tintColor={colors.accent}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) {
              void historyQuery.fetchNextPage();
            }
          }}
          ListFooterComponent={
            historyQuery.isFetchingNextPage ? (
              <ActivityIndicator color={colors.accent} style={styles.footer} />
            ) : null
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  backLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  titleBlock: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  unreadChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  unreadChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
  markAll: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  markAllText: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
  sectionSep: {
    height: spacing.lg,
  },
  itemSep: {
    height: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  skeleton: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  footer: {
    marginVertical: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl + spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  emptyGlow: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  emptyOrb: {
    position: 'absolute',
    top: -36,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptyMessage: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
});
