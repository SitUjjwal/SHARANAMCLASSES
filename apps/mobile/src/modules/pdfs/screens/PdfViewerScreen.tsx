/**
 * PdfViewerScreen — open chapter PDF from URL with cache, download, loading, retry.
 *
 * Flow:
 *   ChapterContent → PdfViewer { courseId, chapterId, pdfId }
 *   Data: chapter detail pdfs[] / contents
 *   Cache: expo-file-system Paths.cache/pdfs
 *   View: WebView (Android native / iOS Google Docs viewer)
 *   Download: expo-sharing share sheet
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useChapterContentQuery } from '@/modules/chapters/hooks/useChapterContentQuery';
import { PdfErrorPanel } from '@/modules/pdfs/components/PdfErrorPanel';
import { PdfLoadingOverlay } from '@/modules/pdfs/components/PdfLoadingOverlay';
import { PdfViewerHeader } from '@/modules/pdfs/components/PdfViewerHeader';
import { PdfWebView } from '@/modules/pdfs/components/PdfWebView';
import { usePdfSource } from '@/modules/pdfs/hooks/usePdfSource';
import { ensurePdfCached } from '@/modules/pdfs/utils/pdfCache';
import { shareOrDownloadPdf } from '@/modules/pdfs/utils/sharePdf';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'PdfViewer'>;

export function PdfViewerScreen({ navigation, route }: Props) {
  const { courseId, chapterId, pdfId } = route.params;
  const insets = useSafeAreaInsets();
  const chapterQuery = useChapterContentQuery(courseId, chapterId);
  const [webError, setWebError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const pdf = useMemo(() => {
    const chapter = chapterQuery.data;
    if (!chapter) return null;

    const fromCatalog = chapter.pdfs?.find((item) => item.id === pdfId);
    if (fromCatalog) return fromCatalog;

    const legacy = chapter.contents.find(
      (item) => item.id === pdfId && item.content_type === 'pdf',
    );
    if (!legacy) return null;

    return {
      id: legacy.id,
      course_id: courseId,
      chapter_id: chapterId,
      title: legacy.title,
      description: legacy.body ?? '',
      file_size: 0,
      original_filename: '',
      sort_order: legacy.sort_order,
      is_free: Boolean(legacy.url),
      is_locked: !legacy.url,
      file_url: legacy.url,
    };
  }, [chapterQuery.data, pdfId, courseId, chapterId]);

  const source = usePdfSource(pdf?.id ?? null, pdf?.file_url ?? null);

  const onDownload = useCallback(async () => {
    if (!pdf?.file_url) return;
    setDownloading(true);
    try {
      const local = source.localUri ?? (await ensurePdfCached(pdf.id, pdf.file_url));
      await shareOrDownloadPdf(local, pdf.title);
    } catch (err) {
      Alert.alert(
        'Download failed',
        err instanceof Error ? err.message : 'Couldn’t save this PDF.',
      );
    } finally {
      setDownloading(false);
    }
  }, [pdf, source.localUri]);

  if (chapterQuery.isLoading && !chapterQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={40} width="80%" />
        <SkeletonBlock height={400} />
      </Screen>
    );
  }

  if (chapterQuery.isError || !chapterQuery.data) {
    return (
      <Screen>
        <PdfErrorPanel
          message={getApiErrorMessage(chapterQuery.error, 'Couldn’t load this PDF.')}
          onRetry={() => {
            void chapterQuery.refetch();
          }}
        />
        <AppButton label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  if (!pdf) {
    return (
      <Screen>
        <EmptyState
          icon="document-outline"
          title="PDF not found"
          message="This file may have been removed or is not published yet."
        />
        <AppButton label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  if (pdf.is_locked || !pdf.file_url) {
    return (
      <Screen style={styles.screen}>
        <View style={[styles.headerPad, { paddingTop: insets.top + spacing.sm }]}>
          <PdfViewerHeader
            title={pdf.title}
            onBack={() => navigation.goBack()}
            onDownload={() => undefined}
          />
        </View>
        <EmptyState
          icon="lock-closed-outline"
          title="PDF locked"
          message="Enroll in this course to open and download the PDF."
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

  const showError = webError || source.error;

  return (
    <Screen style={styles.screen}>
      <View style={[styles.headerPad, { paddingTop: insets.top + spacing.sm }]}>
        <PdfViewerHeader
          title={pdf.title}
          subtitle={
            source.offline ? 'Offline' : pdf.original_filename || chapterQuery.data.course_title
          }
          cached={source.fromCache || Boolean(source.localUri)}
          downloading={downloading}
          onBack={() => navigation.goBack()}
          onDownload={() => {
            void onDownload();
          }}
        />
      </View>

      <View style={styles.viewer}>
        {source.loading ? <PdfLoadingOverlay message="Preparing PDF…" /> : null}

        {!source.loading && showError ? (
          <PdfErrorPanel
            message={showError}
            onRetry={() => {
              setWebError(null);
              source.reload();
            }}
            secondaryLabel={source.localUri ? 'Share / Download' : undefined}
            onSecondary={
              source.localUri
                ? () => {
                    void onDownload();
                  }
                : undefined
            }
          />
        ) : null}

        {!source.loading && !showError && source.viewerUri ? (
          <PdfWebView
            uri={source.viewerUri}
            onError={(message) => setWebError(message)}
          />
        ) : null}
      </View>

      <View style={styles.pad}>
        <AppButton
          label="Report wrong PDF"
          variant="ghost"
          onPress={() =>
            navigation.navigate('ReportContent', {
              report_type: 'wrong_pdf',
              target_type: 'pdf',
              target_id: pdfId,
              course_id: courseId,
              chapter_id: chapterId,
              target_label: pdf.title,
            })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.primary,
  },
  headerPad: {
    backgroundColor: colors.primary,
  },
  viewer: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  pad: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
