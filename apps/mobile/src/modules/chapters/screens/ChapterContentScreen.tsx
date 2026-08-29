/**
 * ChapterContentScreen — Video | PDF | Test tabs (Classplus-style).
 *
 * ChapterList → ChapterContent { courseId, chapterId }
 *   Video → VideoPlayer (live classes also listed here)
 *   PDF   → PdfViewer / NoteViewer
 *   Test  → TestAttempt
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { useChapterContentQuery } from '@/modules/chapters/hooks/useChapterContentQuery';
import { FolderBrowserHeader } from '@/modules/folders/components/FolderBrowserHeader';
import { FolderRow } from '@/modules/folders/components/FolderRow';
import { folderTheme } from '@/modules/folders/theme';
import { formatStartTime } from '@/modules/live-classes/utils/formatLiveTime';
import { useChapterTestsQuery } from '@/modules/tests/hooks/useChapterTestsQuery';
import { openInYouTubeApp } from '@/modules/videos/utils/openYouTube';
import { extractYouTubeVideoId } from '@/modules/videos/utils/youtube';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { updateLastWatchedChapter } from '@/services/myCourse.service';
import { startOrResumeAttempt } from '@/services/test.service';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { spacing, typography } from '@/theme';
import type {
  LiveClassPublic,
  NotePublic,
  PdfPublic,
  TestPublic,
  VideoPublic,
} from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'ChapterContent'>;

type ContentTab = 'video' | 'pdf' | 'test';

const TABS: { key: ContentTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'video', label: 'Video', icon: 'videocam' },
  { key: 'pdf', label: 'PDF', icon: 'document' },
  { key: 'test', label: 'Test', icon: 'clipboard' },
];

export function ChapterContentScreen({ navigation, route }: Props) {
  const { courseId, chapterId } = route.params;
  const contentQuery = useChapterContentQuery(courseId, chapterId);
  const testsQuery = useChapterTestsQuery(courseId, chapterId);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ContentTab>('video');
  const [search, setSearch] = useState('');
  const [startingTestId, setStartingTestId] = useState<string | null>(null);

  useEffect(() => {
    if (!contentQuery.isSuccess) return;
    let cancelled = false;
    void (async () => {
      try {
        await updateLastWatchedChapter(courseId, chapterId);
        if (!cancelled) {
          await queryClient.invalidateQueries({ queryKey: ['my-courses'] });
          await queryClient.invalidateQueries({
            queryKey: ['profile', 'learning-progress'],
          });
        }
      } catch {
        // Not enrolled / offline — ignore; chapter content still works
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chapterId, contentQuery.isSuccess, courseId, queryClient]);

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
            onPress: () =>
              navigation.navigate('MainTabs', {
                screen: 'Tabs',
                params: { screen: 'LiveTab' },
              }),
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

  async function openTest(test: TestPublic) {
    if (test.is_locked) {
      promptEnroll();
      return;
    }
    if (startingTestId) return;
    setStartingTestId(test.id);
    try {
      const session = await startOrResumeAttempt(test.id);
      navigation.navigate('TestAttempt', {
        attemptId: session.attempt.id,
        testId: test.id,
      });
    } catch (err) {
      Alert.alert('Could not start test', getApiErrorMessage(err));
    } finally {
      setStartingTestId(null);
    }
  }

  const q = search.trim().toLowerCase();
  const chapterData = contentQuery.data;

  const videos = useMemo(() => {
    const items = chapterData?.videos ?? [];
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [chapterData?.videos, q]);

  const lives = useMemo(() => {
    const items = chapterData?.live_classes ?? [];
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [chapterData?.live_classes, q]);

  const pdfs = useMemo(() => {
    const items = chapterData?.pdfs ?? [];
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [chapterData?.pdfs, q]);

  const notes = useMemo(() => {
    const items = chapterData?.notes ?? [];
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [chapterData?.notes, q]);

  const tests = useMemo(() => {
    const items = testsQuery.data ?? [];
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [q, testsQuery.data]);

  if (contentQuery.isLoading && !contentQuery.data) {
    return (
      <Screen canvasColor={folderTheme.canvas} style={styles.screen}>
        <View style={styles.skeleton}>
          <SkeletonBlock height={28} width="70%" />
          <SkeletonBlock height={72} />
          <SkeletonBlock height={72} />
        </View>
      </Screen>
    );
  }

  if (contentQuery.isError || !contentQuery.data) {
    return (
      <Screen canvasColor={folderTheme.canvas} style={styles.screen}>
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
  const videoEmpty = videos.length + lives.length === 0;
  const pdfEmpty = pdfs.length + notes.length === 0;
  const testEmpty = tests.length === 0;

  return (
    <Screen canvasColor={folderTheme.canvas} style={styles.screen}>
      <FolderBrowserHeader
        title={chapter.title}
        search={search}
        onSearchChange={setSearch}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active ? styles.tabActive : styles.tabIdle]}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={active ? folderTheme.tabActiveText : folderTheme.text}
              />
              <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={contentQuery.isRefetching || testsQuery.isRefetching}
            onRefresh={() => {
              void contentQuery.refetch();
              void testsQuery.refetch();
            }}
            tintColor={folderTheme.border}
          />
        }
      >
        {tab === 'video' ? (
          videoEmpty ? (
            <EmptyState
              icon="play-circle-outline"
              title="No videos yet"
              message="Videos will appear here when published."
            />
          ) : (
            <View style={styles.stack}>
              {videos.map((video) => (
                <FolderRow
                  key={video.id}
                  kind="video"
                  title={video.title}
                  subtitle="Video"
                  onPress={() => openVideo(video)}
                />
              ))}
              {lives.map((live) => (
                <FolderRow
                  key={live.id}
                  kind="video"
                  title={live.title}
                  subtitle={live.status === 'live' ? 'LIVE NOW' : 'Video'}
                  onPress={() => {
                    void openLive(live);
                  }}
                />
              ))}
            </View>
          )
        ) : null}

        {tab === 'pdf' ? (
          pdfEmpty ? (
            <EmptyState
              icon="document-text-outline"
              title="No PDFs yet"
              message="PDFs and notes will appear here when published."
            />
          ) : (
            <View style={styles.stack}>
              {pdfs.map((pdf) => (
                <FolderRow
                  key={pdf.id}
                  kind="pdf"
                  title={pdf.title}
                  subtitle="PDF Document"
                  onPress={() => openPdf(pdf)}
                />
              ))}
              {notes.map((note) => (
                <FolderRow
                  key={note.id}
                  kind="pdf"
                  title={note.title}
                  subtitle="PDF Document"
                  onPress={() => openNote(note)}
                />
              ))}
            </View>
          )
        ) : null}

        {tab === 'test' ? (
          testsQuery.isError && !testsQuery.data ? (
            <ErrorState
              message={getApiErrorMessage(testsQuery.error, 'Couldn’t load tests.')}
              onRetry={() => {
                void testsQuery.refetch();
              }}
            />
          ) : testEmpty ? (
            <EmptyState
              icon="clipboard-outline"
              title="No tests yet"
              message="Chapter tests will appear here when published."
            />
          ) : (
            <View style={styles.stack}>
              {tests.map((test) => (
                <FolderRow
                  key={test.id}
                  kind="test"
                  title={test.title}
                  subtitle={startingTestId === test.id ? 'Starting…' : 'Test'}
                  onPress={() => {
                    void openTest(test);
                  }}
                />
              ))}
            </View>
          )
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: folderTheme.canvas,
  },
  skeleton: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: folderTheme.tabActiveBg,
    borderColor: folderTheme.tabActiveBg,
  },
  tabIdle: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  tabLabel: {
    color: folderTheme.text,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: folderTheme.tabActiveText,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
    flexGrow: 1,
  },
  stack: {
    gap: spacing.md,
  },
});
