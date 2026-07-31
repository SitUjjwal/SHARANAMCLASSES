/**
 * VideoPlayerScreen — in-app YouTube playback with poster, meta, and fallbacks.
 *
 * Flow:
 *   ChapterContent → VideoPlayer { courseId, chapterId, videoId }
 *   Data: reuse chapter detail cache (videos[]) + course detail (teacher_name)
 *   Play → embed via react-native-youtube-iframe; on failure → open YouTube app
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useChapterContentQuery } from '@/modules/chapters/hooks/useChapterContentQuery';
import { useCourseDetailQuery } from '@/modules/courses/hooks/useCourseDetailQuery';
import { VideoPoster } from '@/modules/videos/components/VideoPoster';
import { YouTubeEmbed } from '@/modules/videos/components/YouTubeEmbed';
import { formatVideoDuration } from '@/modules/videos/utils/formatVideoDuration';
import { openInYouTubeApp } from '@/modules/videos/utils/openYouTube';
import {
  extractYouTubeVideoId,
  watchUrlForVideoId,
  youtubeThumbnailUrl,
} from '@/modules/videos/utils/youtube';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'VideoPlayer'>;

type PlayerMode = 'poster' | 'embed';

export function VideoPlayerScreen({ navigation, route }: Props) {
  const { courseId, chapterId, videoId } = route.params;
  const insets = useSafeAreaInsets();

  const chapterQuery = useChapterContentQuery(courseId, chapterId);
  const courseQuery = useCourseDetailQuery(courseId);

  const [mode, setMode] = useState<PlayerMode>('poster');
  const [playing, setPlaying] = useState(false);
  const [checkingNetwork, setCheckingNetwork] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState<string | null>(null);

  const video = useMemo(() => {
    const chapter = chapterQuery.data;
    if (!chapter) return null;
    const fromCatalog = chapter.videos?.find((item) => item.id === videoId);
    if (fromCatalog) return fromCatalog;

    const legacy = chapter.contents.find(
      (item) => item.id === videoId && item.content_type === 'video',
    );
    if (!legacy) return null;

    return {
      id: legacy.id,
      course_id: courseId,
      chapter_id: chapterId,
      title: legacy.title,
      description: legacy.body ?? '',
      video_type: 'recorded' as const,
      thumbnail_url: null,
      duration_seconds: legacy.duration_seconds ?? 0,
      sort_order: legacy.sort_order,
      is_free: Boolean(legacy.url),
      is_locked: !legacy.url,
      youtube_url: legacy.url,
    };
  }, [chapterQuery.data, videoId, courseId, chapterId]);

  const youtubeVideoId = useMemo(() => {
    if (!video?.youtube_url) return null;
    return extractYouTubeVideoId(video.youtube_url);
  }, [video?.youtube_url]);

  const thumbnailUrl = useMemo(() => {
    if (video?.thumbnail_url) return video.thumbnail_url;
    if (youtubeVideoId) return youtubeThumbnailUrl(youtubeVideoId);
    return null;
  }, [video?.thumbnail_url, youtubeVideoId]);

  const teacherName =
    courseQuery.data?.teacher_name?.trim() || 'SHARANAM Faculty';

  useEffect(() => {
    setMode('poster');
    setPlaying(false);
    setNetworkError(null);
    setEmbedError(null);
  }, [videoId]);

  const openExternal = useCallback(async () => {
    if (!youtubeVideoId) return;
    const url = video?.youtube_url ?? watchUrlForVideoId(youtubeVideoId);
    await openInYouTubeApp({ youtubeUrl: url, videoId: youtubeVideoId });
  }, [video?.youtube_url, youtubeVideoId]);

  const startPlayback = useCallback(async () => {
    setNetworkError(null);
    setEmbedError(null);
    setCheckingNetwork(true);

    try {
      const state = await NetInfo.fetch();
      const offline = state.isConnected === false || state.isInternetReachable === false;
      if (offline) {
        setNetworkError('No internet connection. Check your network and try again.');
        return;
      }

      if (!youtubeVideoId) {
        setEmbedError('This video link is invalid.');
        return;
      }

      setMode('embed');
      setPlaying(true);
    } finally {
      setCheckingNetwork(false);
    }
  }, [youtubeVideoId]);

  const handleEmbedError = useCallback(
    (message: string) => {
      setPlaying(false);
      setMode('poster');
      setEmbedError(
        message.includes('network') || message.toLowerCase().includes('error')
          ? 'Couldn’t embed this video. Open it in the YouTube app instead.'
          : message,
      );
    },
    [],
  );

  if (chapterQuery.isLoading && !chapterQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={220} />
        <SkeletonBlock height={28} width="80%" />
        <SkeletonBlock height={18} width="50%" />
      </Screen>
    );
  }

  if (chapterQuery.isError || !chapterQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(chapterQuery.error, 'Couldn’t load this video.')}
          onRetry={() => {
            void chapterQuery.refetch();
          }}
        />
        <AppButton label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  if (!video) {
    return (
      <Screen>
        <EmptyState
          icon="videocam-off-outline"
          title="Video not found"
          message="This lesson may have been removed or is not published yet."
        />
        <AppButton label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  if (video.is_locked || !video.youtube_url) {
    return (
      <Screen style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </Pressable>
          <Text style={styles.headerTitle}>Video</Text>
        </View>
        <View style={styles.body}>
          <EmptyState
            icon="lock-closed-outline"
            title="Video locked"
            message="Enroll in this course to watch the full lesson."
          />
          <AppButton
            label="View course"
            onPress={() => navigation.navigate('CourseDetail', { courseId })}
          />
        </View>
      </Screen>
    );
  }

  const showError = networkError || embedError;

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Now playing
          </Text>
        </View>

        <View style={styles.playerCard}>
          {mode === 'embed' && youtubeVideoId ? (
            <YouTubeEmbed
              videoId={youtubeVideoId}
              playing={playing}
              onPlayingChange={setPlaying}
              onError={handleEmbedError}
            />
          ) : (
            <VideoPoster
              thumbnailUrl={thumbnailUrl}
              loading={checkingNetwork}
              onPlay={() => {
                void startPlayback();
              }}
            />
          )}
        </View>

        <View style={styles.meta}>
          <Text style={styles.kicker}>
            {video.video_type === 'live' ? 'Live' : 'Recorded'}
            {video.is_free ? ' · Free preview' : ''}
          </Text>
          <Text style={styles.title}>{video.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={16} color="#A8B3C5" />
            <Text style={styles.metaText}>{teacherName}</Text>
            <Text style={styles.dot}>·</Text>
            <Ionicons name="time-outline" size={16} color="#A8B3C5" />
            <Text style={styles.metaText}>{formatVideoDuration(video.duration_seconds)}</Text>
          </View>

          {video.description ? (
            <Text style={styles.description}>{video.description}</Text>
          ) : null}

          {checkingNetwork ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.inlineLoadingText}>Checking connection…</Text>
            </View>
          ) : null}

          {showError ? (
            <View style={styles.errorBlock}>
              <ErrorState
                message={showError}
                onRetry={() => {
                  void startPlayback();
                }}
              />
              {youtubeVideoId ? (
                <AppButton
                  label="Open in YouTube"
                  variant="ghost"
                  onPress={() => {
                    void openExternal();
                  }}
                />
              ) : null}
            </View>
          ) : (
            <View style={styles.actions}>
              {mode === 'poster' ? (
                <AppButton
                  label="Play"
                  onPress={() => {
                    void startPlayback();
                  }}
                />
              ) : (
                <AppButton
                  label={playing ? 'Pause' : 'Resume'}
                  onPress={() => setPlaying((prev) => !prev)}
                />
              )}
              <AppButton
                label="Open in YouTube"
                variant="ghost"
                onPress={() => {
                  void openExternal();
                }}
              />
            </View>
          )}
        </View>
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
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    flex: 1,
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  playerCard: {
    marginHorizontal: spacing.lg,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
  },
  meta: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  kicker: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
  },
  dot: {
    color: '#A8B3C5',
    marginHorizontal: 2,
  },
  description: {
    marginTop: spacing.sm,
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  errorBlock: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  inlineLoadingText: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
});
