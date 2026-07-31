/**
 * LiveClassesScreen — student live now + upcoming countdown list.
 *
 * LIVE NOW → Join Live (YouTube)
 * Upcoming → Starts in HH:MM:SS
 */
import { useCallback, useMemo } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
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
import { useLiveClassesQuery } from '@/modules/live-classes/hooks/useLiveClassesQuery';
import { openInYouTubeApp } from '@/modules/videos/utils/openYouTube';
import { extractYouTubeVideoId } from '@/modules/videos/utils/youtube';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';
import type { LiveClassPublic } from '@sharanam/shared';

export function LiveClassesScreen() {
  const insets = useSafeAreaInsets();
  const liveQuery = useLiveClassesQuery();

  const { liveNow, upcoming, ended } = useMemo(() => {
    const items = liveQuery.data ?? [];
    const now = Date.now();
    const liveNowList: LiveClassPublic[] = [];
    const upcomingList: LiveClassPublic[] = [];
    const endedList: LiveClassPublic[] = [];

    for (const item of items) {
      const start = Date.parse(item.start_time);
      const end = Date.parse(item.end_time);
      if (!Number.isNaN(end) && now > end) {
        endedList.push({ ...item, status: 'ended' });
      } else if (!Number.isNaN(start) && now >= start) {
        liveNowList.push({ ...item, status: 'live' });
      } else {
        upcomingList.push({ ...item, status: 'upcoming' });
      }
    }

    upcomingList.sort(
      (a, b) => Date.parse(a.start_time) - Date.parse(b.start_time),
    );
    return { liveNow: liveNowList, upcoming: upcomingList, ended: endedList };
  }, [liveQuery.data]);

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

  const hasAny = liveNow.length + upcoming.length + ended.length > 0;

  return (
    <Screen style={styles.screen}>
      <ScrollView
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
      >
        <Text style={styles.screenTitle}>Live Classes</Text>
        <Text style={styles.screenSubtitle}>Join live sessions or wait for the countdown.</Text>

        {!hasAny ? (
          <EmptyState
            icon="radio-outline"
            title="No live classes"
            message="When a live class is scheduled, it will appear here."
          />
        ) : null}

        {liveNow.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live now</Text>
            {liveNow.map((item) => (
              <LiveClassCard key={item.id} liveClass={item} onJoin={onJoin} />
            ))}
          </View>
        ) : null}

        {upcoming.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {upcoming.map((item) => (
              <LiveClassCard key={item.id} liveClass={item} onJoin={onJoin} />
            ))}
          </View>
        ) : null}

        {ended.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ended</Text>
            {ended.slice(0, 5).map((item) => (
              <LiveClassCard key={item.id} liveClass={item} onJoin={onJoin} />
            ))}
          </View>
        ) : null}

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

        <Pressable onPress={() => void liveQuery.refetch()} style={styles.refreshHint}>
          <Text style={styles.refreshText}>Pull to refresh · auto-updates every 30s</Text>
        </Pressable>
      </ScrollView>
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
