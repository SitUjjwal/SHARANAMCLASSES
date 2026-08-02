/**
 * CertificateViewerScreen — number, issue date, Download PDF, Share.
 */
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { AppButton } from '@/components/ui/AppButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { fetchCertificate } from '@/modules/profile/services/certificateService';
import type { AppStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'CertificateViewer'>;

export function CertificateViewerScreen({ route, navigation }: Props) {
  const { certificateId } = route.params;
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['certificates', certificateId],
    queryFn: () => fetchCertificate(certificateId),
  });

  const item = query.data;

  const downloadToCache = useCallback(async (): Promise<string | null> => {
    if (!item?.certificate_url) {
      setActionError('PDF is not available yet.');
      return null;
    }
    const safeName = `${(item.certificate_number ?? item.id).replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`;
    const target = new File(Paths.cache, safeName);
    const downloaded = await File.downloadFileAsync(item.certificate_url, target, {
      idempotent: true,
    });
    return downloaded.uri;
  }, [item]);

  async function onDownload() {
    setActionError(null);
    setBusy(true);
    try {
      const uri = await downloadToCache();
      if (!uri) return;
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save certificate PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Downloaded', 'Certificate PDF saved to app cache.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    setActionError(null);
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setActionError('Sharing is not available on this device.');
        return;
      }
      const uri = await downloadToCache();
      if (!uri) return;
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share certificate',
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Share failed');
    } finally {
      setBusy(false);
    }
  }

  const issuedLabel = item?.issued_at
    ? new Date(item.issued_at).toLocaleDateString('en-IN', { dateStyle: 'long' })
    : '—';

  return (
    <Screen>
      <LoadingOverlay
        visible={(query.isPending && !item) || busy}
        message={busy ? 'Preparing PDF…' : 'Loading…'}
      />

      {query.isError && !item ? (
        <ErrorState
          message={
            query.error instanceof Error
              ? query.error.message
              : 'Failed to load certificate'
          }
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : null}

      {item ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.kicker}>
            {item.status === 'issued' ? 'Issued certificate' : 'Pending approval'}
          </Text>
          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.panel}>
            <Text style={styles.label}>Certificate Number</Text>
            <Text style={styles.value}>
              {item.certificate_number ?? 'Assigned after approval'}
            </Text>

            <Text style={styles.label}>Issue Date</Text>
            <Text style={styles.value}>{issuedLabel}</Text>

            {item.course_title ? (
              <>
                <Text style={styles.label}>Course</Text>
                <Text style={styles.value}>{item.course_title}</Text>
              </>
            ) : null}

            {item.student_name ? (
              <>
                <Text style={styles.label}>Student</Text>
                <Text style={styles.value}>{item.student_name}</Text>
              </>
            ) : null}
          </View>

          {item.description ? <Text style={styles.body}>{item.description}</Text> : null}

          <ErrorMessage message={actionError} />

          {item.status === 'issued' && item.certificate_url ? (
            <View style={styles.actions}>
              <AppButton label="Download PDF" onPress={() => void onDownload()} loading={busy} />
              <AppButton
                label="Share"
                variant="ghost"
                onPress={() => void onShare()}
                disabled={busy}
              />
            </View>
          ) : (
            <Text style={styles.meta}>
              {item.status === 'pending_approval'
                ? 'Waiting for admin approval. You can download the PDF once it is issued.'
                : 'This certificate is not available for download.'}
            </Text>
          )}

          <AppButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  kicker: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  panel: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    marginTop: spacing.sm,
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  value: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  body: { color: colors.surface, fontSize: typography.fontSize.md, lineHeight: 22 },
  meta: { color: '#A8B3C5', fontSize: typography.fontSize.md, lineHeight: 20 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
