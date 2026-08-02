/**
 * NotificationCenterScreen
 *
 * Unread badge (home), mark read, delete, pull-to-refresh,
 * pagination, grouped by date.
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
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
import { colors, spacing, typography } from '@/theme';
import type { NotificationInboxItem } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'NotificationCenter'>;

export function NotificationCenterScreen({ navigation }: Props) {
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
        <AppButton label="← Back" variant="ghost" onPress={() => navigation.goBack()} />
        <View style={styles.titleRow}>
          <SectionHeader title="Notifications" />
          {unreadCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void markAll.mutateAsync();
              }}
              style={styles.markAll}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          {unreadCount > 0
            ? `${unreadCount} unread`
            : 'Updates, live classes, and test reminders'}
        </Text>
      </View>

      {historyQuery.isLoading && !historyQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={88} radius={14} />
          <SkeletonBlock height={88} radius={14} />
          <SkeletonBlock height={88} radius={14} />
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
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title="No notifications yet"
              message="When we send announcements or reminders, they will show up here."
            />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item, index, section }) => (
            <NotificationInboxRow
              item={item}
              showDivider={index < section.data.length - 1}
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
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  markAll: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
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
  sectionTitle: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  skeleton: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  footer: {
    marginVertical: spacing.lg,
  },
});
