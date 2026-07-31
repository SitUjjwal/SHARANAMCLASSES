/**
 * ChapterContentScreen — syllabus content in fixed order:
 *   Videos → PDFs → Notes → Live Classes
 *
 * Navigation
 * ----------
 * CourseDetail / ChapterList
 *   → ChapterContent { courseId, chapterId }
 *        → Video  → VideoPlayer
 *        → PDF    → PdfViewer
 *        → Note   → NoteViewer
 *        → Live   → YouTube (Join) or Live tab
 *
 * Badges: Free preview · Locked (not purchased)
 */
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChapterContentQuery } from '@/modules/chapters/hooks/useChapterContentQuery';
import { formatDuration } from '@/modules/chapters/utils/formatDuration';
import { formatStartTime } from '@/modules/live-classes/utils/formatLiveTime';
import { openInYouTubeApp } from '@/modules/videos/utils/openYouTube';
import { extractYouTubeVideoId } from '@/modules/videos/utils/youtube';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';
import type {
  LiveClassPublic,
  NotePublic,
  PdfPublic,
  VideoPublic,
} from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'ChapterContent'>;

type ContentKind = 'video' | 'pdf' | 'note' | 'live';

function iconFor(kind: ContentKind): keyof typeof Ionicons.glyphMap {
  if (kind === 'video') return 'play-circle';
  if (kind === 'pdf') return 'document-text';
  if (kind === 'note') return 'newspaper';
  return 'radio';
}

export function ChapterContentScreen({ navigation, route }: Props) {
  const { courseId, chapterId } = route.params;
  const insets = useSafeAreaInsets();
  const contentQuery = useChapterContentQuery(courseId, chapterId);

  function promptEnroll() {
    Alert.alert('Locked', 'Enroll in this course to unlock this content.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'View course',
        onPress: () => navigation.navigate('CourseDetail', { courseId }),
      },
    ]);
  }

  function openVideo(video: VideoPublic) {
    if (video.is_locked || !video.youtube_url) {
      promptEnroll();
      return;
    }
    navigation.navigate('VideoPlayer', {
      courseId,
      chapterId,
      videoId: video.id,
    });
  }

  function openPdf(pdf: PdfPublic) {
    if (pdf.is_locked || !pdf.file_url) {
      promptEnroll();
      return;
    }
    navigation.navigate('PdfViewer', {
      courseId,
      chapterId,
      pdfId: pdf.id,
    });
  }

  function openNote(note: NotePublic) {
    if (note.is_locked || !note.notes_url) {
      promptEnroll();
      return;
    }
    navigation.navigate('NoteViewer', {
      courseId,
      chapterId,
      noteId: note.id,
    });
  }

  async function openLive(live: LiveClassPublic) {
    if (!live.youtube_url) {
      Alert.alert('Unavailable', 'This live stream is not available yet.');
      return;
    }
    if (live.status === 'upcoming') {
      Alert.alert(
        'Starting soon',
        `This class starts at ${formatStartTime(live.start_time)}. Open the Live tab for the countdown.`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Open Live tab',
            onPress: () => navigation.navigate('MainTabs', { screen: 'LiveTab' }),
          },
        ],
      );
      return;
    }
    const videoId = extractYouTubeVideoId(live.youtube_url);
    if (!videoId) {
      Alert.alert('Invalid link', 'Could not open this YouTube Live URL.');
      return;
    }
    await openInYouTubeApp({ youtubeUrl: live.youtube_url, videoId });
  }

  if (contentQuery.isLoading && !contentQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={28} width="70%" />
        <SkeletonBlock height={72} />
        <SkeletonBlock height={72} />
      </Screen>
    );
  }

  if (contentQuery.isError || !contentQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(contentQuery.error, 'Chapter not found.')}
          onRetry={() => {
            void contentQuery.refetch();
          }}
        />
        <AppButton label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const chapter = contentQuery.data;
  const videos = chapter.videos ?? [];
  const pdfs = chapter.pdfs ?? [];
  const notes = chapter.notes ?? [];
  const lives = chapter.live_classes ?? [];
  const hasContent =
    videos.length + pdfs.length + notes.length + lives.length > 0;

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>
              Chapter {chapter.chapter_number} · {formatDuration(chapter.duration_seconds)}
            </Text>
            <Text style={styles.title}>{chapter.title}</Text>
            <Text style={styles.subtitle}>{chapter.course_title}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {chapter.description ? (
            <Text style={styles.description}>{chapter.description}</Text>
          ) : null}

          {chapter.is_locked ? (
            <View style={styles.lockBanner}>
              <Ionicons name="lock-closed" size={18} color={colors.accent} />
              <Text style={styles.lockBannerText}>
                Course not purchased — free previews stay open; other items are locked.
              </Text>
              <AppButton
                label="View course"
                onPress={() => navigation.navigate('CourseDetail', { courseId })}
              />
            </View>
          ) : null}

          {!hasContent ? (
            <EmptyState
              icon="folder-open-outline"
              title="No content yet"
              message="Videos, PDFs, notes, and live classes will appear here when published."
            />
          ) : null}

          {/* Order: Videos → PDFs → Notes → Live Classes */}
          {videos.length ? (
            <Section title="Videos" icon="play-circle">
              {videos.map((video) => (
                <ContentRow
                  key={video.id}
                  kind="video"
                  title={video.title}
                  meta={
                    video.duration_seconds
                      ? formatDuration(video.duration_seconds)
                      : video.video_type === 'live'
                        ? 'Live recording'
                        : undefined
                  }
                  isFree={video.is_free}
                  isLocked={video.is_locked}
                  onPress={() => openVideo(video)}
                />
              ))}
            </Section>
          ) : null}

          {pdfs.length ? (
            <Section title="PDFs" icon="document-text">
              {pdfs.map((pdf) => (
                <ContentRow
                  key={pdf.id}
                  kind="pdf"
                  title={pdf.title}
                  meta={pdf.original_filename || undefined}
                  isFree={pdf.is_free}
                  isLocked={pdf.is_locked}
                  onPress={() => openPdf(pdf)}
                />
              ))}
            </Section>
          ) : null}

          {notes.length ? (
            <Section title="Notes" icon="newspaper">
              {notes.map((note) => (
                <ContentRow
                  key={note.id}
                  kind="note"
                  title={note.title}
                  meta={note.description || undefined}
                  isFree={note.is_free}
                  isLocked={note.is_locked}
                  onPress={() => openNote(note)}
                />
              ))}
            </Section>
          ) : null}

          {lives.length ? (
            <Section title="Live Classes" icon="radio">
              {lives.map((live) => (
                <ContentRow
                  key={live.id}
                  kind="live"
                  title={live.title}
                  meta={`${live.status === 'live' ? 'LIVE NOW' : 'Upcoming'} · ${formatStartTime(live.start_time)}`}
                  isFree
                  isLocked={false}
                  liveStatus={live.status}
                  onPress={() => {
                    void openLive(live);
                  }}
                />
              ))}
            </Section>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={20} color={colors.accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ContentRow({
  kind,
  title,
  meta,
  isFree,
  isLocked,
  liveStatus,
  onPress,
}: {
  kind: ContentKind;
  title: string;
  meta?: string;
  isFree: boolean;
  isLocked: boolean;
  liveStatus?: LiveClassPublic['status'];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.item, isLocked ? styles.itemLocked : null]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={iconFor(kind)} size={22} color={colors.accent} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.badgeRow}>
          {liveStatus === 'live' ? (
            <View style={[styles.badge, styles.badgeLive]}>
              <Text style={styles.badgeLiveText}>LIVE NOW</Text>
            </View>
          ) : null}
          {isFree && !isLocked ? (
            <View style={[styles.badge, styles.badgeFree]}>
              <Text style={styles.badgeFreeText}>Free preview</Text>
            </View>
          ) : null}
          {isLocked ? (
            <View style={[styles.badge, styles.badgeLock]}>
              <Ionicons name="lock-closed" size={11} color="#F5C6C6" />
              <Text style={styles.badgeLockText}>Locked</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.itemTitle}>{title}</Text>
        {meta ? <Text style={styles.itemMeta} numberOfLines={2}>{meta}</Text> : null}
      </View>
      <Ionicons
        name={isLocked ? 'lock-closed-outline' : kind === 'video' || kind === 'live' ? 'play' : 'chevron-forward'}
        size={18}
        color="#A8B3C5"
      />
    </Pressable>
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
    alignItems: 'flex-start',
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
  headerText: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  description: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  lockBanner: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.35)',
    backgroundColor: 'rgba(201,162,39,0.1)',
  },
  lockBannerText: {
    color: '#E8D48A',
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  itemLocked: {
    opacity: 0.85,
    borderColor: 'rgba(198,40,40,0.25)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,162,39,0.12)',
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeFree: {
    backgroundColor: 'rgba(46,125,50,0.25)',
  },
  badgeFreeText: {
    color: '#A5D6A7',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeLock: {
    backgroundColor: 'rgba(198,40,40,0.22)',
  },
  badgeLockText: {
    color: '#F5C6C6',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeLive: {
    backgroundColor: 'rgba(229,57,53,0.25)',
  },
  badgeLiveText: {
    color: '#FF8A80',
    fontSize: 11,
    fontWeight: '800',
  },
  itemTitle: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  itemMeta: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
});
