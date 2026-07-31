/**
 * NoteViewerScreen — open notes HTTPS URL safely in WebView.
 * Blocks non-https navigations; offers open-in-browser fallback.
 */
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useChapterContentQuery } from '@/modules/chapters/hooks/useChapterContentQuery';
import {
  isSafeNotesUrl,
  normalizeSafeNotesUrl,
} from '@/modules/notes/utils/safeNotesUrl';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'NoteViewer'>;

type WebViewNavRequest = {
  url: string;
};

export function NoteViewerScreen({ navigation, route }: Props) {
  const { courseId, chapterId, noteId } = route.params;
  const insets = useSafeAreaInsets();
  const chapterQuery = useChapterContentQuery(courseId, chapterId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const note = useMemo(() => {
    const chapter = chapterQuery.data;
    if (!chapter) return null;
    const fromCatalog = chapter.notes?.find((item) => item.id === noteId);
    if (fromCatalog) return fromCatalog;

    const legacy = chapter.contents.find(
      (item) => item.id === noteId && item.content_type === 'note',
    );
    if (!legacy) return null;
    return {
      id: legacy.id,
      course_id: courseId,
      chapter_id: chapterId,
      title: legacy.title,
      description: legacy.body ?? '',
      sort_order: legacy.sort_order,
      is_free: Boolean(legacy.url),
      is_locked: !legacy.url && !legacy.body,
      notes_url: legacy.url,
    };
  }, [chapterQuery.data, noteId, courseId, chapterId]);

  const safeUrl = useMemo(
    () => (note?.notes_url ? normalizeSafeNotesUrl(note.notes_url) : null),
    [note?.notes_url],
  );

  const onShouldStartLoadWithRequest = useCallback((request: WebViewNavRequest) => {
    // Allow about:blank / initial frame
    if (!request.url || request.url === 'about:blank') return true;
    return isSafeNotesUrl(request.url);
  }, []);

  const openExternal = useCallback(async () => {
    if (!safeUrl) return;
    const can = await Linking.canOpenURL(safeUrl);
    if (can) {
      await Linking.openURL(safeUrl);
    }
  }, [safeUrl]);

  if (chapterQuery.isLoading && !chapterQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={40} width="70%" />
        <SkeletonBlock height={400} />
      </Screen>
    );
  }

  if (chapterQuery.isError || !chapterQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(chapterQuery.error, 'Couldn’t load this note.')}
          onRetry={() => {
            void chapterQuery.refetch();
          }}
        />
        <AppButton label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  if (!note) {
    return (
      <Screen>
        <EmptyState
          icon="newspaper-outline"
          title="Note not found"
          message="This note may have been removed or is not published yet."
        />
        <AppButton label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  if (note.is_locked || (!note.notes_url && !note.description)) {
    return (
      <Screen style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </Pressable>
          <Text style={styles.title}>{note.title}</Text>
        </View>
        <EmptyState
          icon="lock-closed-outline"
          title="Note locked"
          message="Enroll in this course to open these notes."
        />
        <View style={styles.pad}>
          <AppButton
            label="View course"
            onPress={() => navigation.navigate('CourseDetail', { courseId })}
          />
        </View>
      </Screen>
    );
  }

  // Body-only legacy note (no URL)
  if (!safeUrl) {
    return (
      <Screen style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </Pressable>
          <Text style={styles.title}>{note.title}</Text>
        </View>
        <View style={styles.pad}>
          {note.description ? (
            <Text style={styles.bodyText}>{note.description}</Text>
          ) : (
            <EmptyState
              icon="link-outline"
              title="Invalid notes link"
              message="This note doesn’t have a safe HTTPS URL."
            />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.surface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Secure HTTPS view
          </Text>
        </View>
        <Pressable onPress={() => void openExternal()} style={styles.backBtn} accessibilityLabel="Open in browser">
          <Ionicons name="open-outline" size={20} color={colors.accent} />
        </Pressable>
      </View>

      <View style={styles.viewer}>
        {loading && !error ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Opening notes…</Text>
          </View>
        ) : null}
        {error ? (
          <View style={styles.pad}>
            <ErrorState
              message={error}
              onRetry={() => {
                setError(null);
                setLoading(true);
              }}
            />
            <AppButton label="Open in browser" variant="ghost" onPress={() => void openExternal()} />
          </View>
        ) : (
          <WebView
            key={safeUrl}
            source={{ uri: safeUrl }}
            style={styles.webview}
            originWhitelist={['https://*']}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Couldn’t open this notes link. Try again or open in browser.');
            }}
            onHttpError={() => {
              setLoading(false);
              setError('Notes link returned an error. Retry or open in browser.');
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
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
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    flex: 1,
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  viewer: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,31,58,0.65)',
  },
  loadingText: {
    color: colors.surface,
    fontWeight: '600',
  },
  pad: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  bodyText: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
});
