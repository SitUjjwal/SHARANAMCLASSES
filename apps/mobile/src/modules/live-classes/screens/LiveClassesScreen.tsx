/**
 * LiveClassesScreen — student live now + upcoming countdown list.
 *
 * LIVE NOW → Join Live (YouTube)
 * Upcoming → Starts in HH:MM:SS
 */
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { LiveClassCard } from '@/modules/live-classes/components/LiveClassCard';
import { useLiveClassesInfiniteQuery } from '@/modules/live-classes/hooks/useLiveClassesInfiniteQuery';
import { openInYouTubeApp } from '@/modules/videos/utils/openYouTube';
import { extractYouTubeVideoId } from '@/modules/videos/utils/youtube';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';
import type { LiveClassPublic } from '@sharanam/shared';

type Row =
  | { type: 'header'; title: string; key: string }
  | { type: 'item'; liveClass: LiveClassPublic; key: string };

export function LiveClassesScreen() {
  const insets = useSafeAreaInsets();
  const liveQuery = useLiveClassesInfiniteQuery(20);

  const items = useMemo(
    () => liveQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [liveQuery.data],
  );

  const { liveNow, upcoming } = useMemo(() => {
    const now = Date.now();
    const liveNowList: LiveClassPublic[] = [];
    const upcomingList: LiveClassPublic[] = [];

    for (const item of items) {
      const start = Date.parse(item.start_time);
      const end = Date.parse(item.end_time);
      // Ended lives are archived onto the related course — hide from Live tab.
      if (!Number.isNaN(end) && now > end) {
        continue;
      }
      if (!Number.isNaN(start) && now >= start) {
        liveNowList.push({ ...item, status: 'live' });
      } else {
        upcomingList.push({ ...item, status: 'upcoming' });
      }
    }

    upcomingList.sort(
      (a, b) => Date.parse(a.start_time) - Date.parse(b.start_time),
    );
    return { liveNow: liveNowList, upcoming: upcomingList };
  }, [items]);

  const rows = useMemo(() => {
    const out: Row[] = [];
    if (liveNow.length) {
      out.push({ type: 'header', title: 'Live now', key: 'h-live' });
      for (const liveClass of liveNow) {
        out.push({ type: 'item', liveClass, key: liveClass.id });
      }
    }
    if (upcoming.length) {
      out.push({ type: 'header', title: 'Upcoming', key: 'h-up' });
      for (const liveClass of upcoming) {
        out.push({ type: 'item', liveClass, key: liveClass.id });
      }
    }
    return out;
  }, [liveNow, upcoming]);

  const onJoin = useCallback(async (liveClass: LiveClassPublic) => {
    if (!liveClass.youtube_url) {
      Alert.alert('Unavailable', 'This live stream link is not available yet.');
      return;
    }
    const videoId = extractYouTubeVideoId(liveClass.youtube_url);
    if (!videoId) {
      Alert.alert('Invalid link', 'Could not open this YouTube Live URL.');
      return;
    }
    try {
      await openInYouTubeApp({
        youtubeUrl: liveClass.youtube_url,
        videoId,
      });
    } catch {
      Alert.alert('Couldn’t open', 'Unable to open YouTube. Try again.');
    }
  }, []);

  if (liveQuery.isLoading && !liveQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={28} width="50%" />
        <SkeletonBlock height={120} />
        <SkeletonBlock height={120} />
      </Screen>
    );
  }

  if (liveQuery.isError && !liveQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(liveQuery.error, 'Couldn’t load live classes.')}
          onRetry={() => {
            void liveQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.sm }]}
        refreshControl={
          <RefreshControl
            refreshing={liveQuery.isRefetching}
            onRefresh={() => {
              void liveQuery.refetch();
            }}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.screenTitle}>Live Classes</Text>
            <Text style={styles.screenSubtitle}>
              Join live sessions or wait for the countdown. Ended classes move to the course.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="radio-outline"
            title="No live classes"
            message="When a live class is scheduled, it will appear here."
          />
        }
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <Text style={styles.sectionTitle}>{item.title}</Text>
          ) : (
            <LiveClassCard liveClass={item.liveClass} onJoin={onJoin} />
          )
        }
        onEndReached={() => {
          if (liveQuery.hasNextPage && !liveQuery.isFetchingNextPage) {
            void liveQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          liveQuery.isFetchingNextPage ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} />
          ) : (
            <Pressable onPress={() => void liveQuery.refetch()} style={styles.refreshHint}>
              <Text style={styles.refreshText}>Pull to refresh · auto-updates every 30s</Text>
            </Pressable>
          )
        }
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
      />
      {liveQuery.isError ? (
        <View style={styles.retryWrap}>
          <AppButton
            label="Retry"
            variant="ghost"
            onPress={() => {
              void liveQuery.refetch();
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.lg,
  },
  screenTitle: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    marginTop: -spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  retryWrap: {
    marginTop: spacing.sm,
  },
  refreshHint: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  refreshText: {
    color: '#7A8799',
    fontSize: typography.fontSize.sm,
  },
});
