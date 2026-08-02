/**
 * BugReportDetailScreen — track one bug report status.
 */
import { useCallback, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '@/components/ui/AppButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { fetchBugReport } from '@/modules/feedback/services/bugReportService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { BugReport, BugReportStatus } from '@sharanam/shared';
import { BUG_REPORT_STATUS_LABELS } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'BugReportDetail'>;

const STATUS_ORDER: BugReportStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function BugReportDetailScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { reportId } = route.params;
  const [report, setReport] = useState<BugReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setReport(await fetchBugReport(reportId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load report'));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const currentIndex = report ? STATUS_ORDER.indexOf(report.status) : -1;

  return (
    <Screen>
      <LoadingOverlay visible={loading} message="Loading…" />
      {error && !loading ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}

      {!loading && report ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => void load()}
              tintColor={theme.accent}
            />
          }
        >
          <Text style={[styles.ticket, { color: theme.accent }]}>
            {report.ticket_number}
          </Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {report.screen_label}
          </Text>

          <Text style={[styles.section, { color: theme.textSecondary }]}>Status</Text>
          <View style={styles.timeline}>
            {STATUS_ORDER.map((status) => {
              const index = STATUS_ORDER.indexOf(status);
              const reached = index <= currentIndex;
              const isCurrent = report.status === status;
              return (
                <View key={status} style={styles.timelineRow}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: reached ? theme.accent : theme.cardBorder,
                      },
                    ]}
                  />
                  <Text
                    style={{
                      color: isCurrent ? theme.textPrimary : theme.textSecondary,
                      fontWeight: isCurrent ? '700' : '500',
                      fontSize: typography.fontSize.md,
                    }}
                  >
                    {BUG_REPORT_STATUS_LABELS[status]}
                  </Text>
                </View>
              );
            })}
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
              Description
            </Text>
            <Text style={[styles.body, { color: theme.textPrimary }]}>
              {report.description}
            </Text>
            {report.screenshot_url ? (
              <Image
                source={{ uri: report.screenshot_url }}
                style={styles.shot}
              />
            ) : null}
            {report.admin_note ? (
              <>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
                  Admin note
                </Text>
                <Text style={[styles.body, { color: theme.textPrimary }]}>
                  {report.admin_note}
                </Text>
              </>
            ) : null}
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              Submitted {formatDate(report.created_at)}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              Updated {formatDate(report.updated_at)}
            </Text>
          </View>

          <AppButton
            label="Back to my reports"
            onPress={() => navigation.navigate('MyBugReports')}
          />
          <AppButton label="Close" variant="ghost" onPress={() => navigation.goBack()} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  ticket: { fontSize: typography.fontSize.md, fontWeight: '700' },
  title: { fontSize: typography.fontSize.xxl, fontWeight: '700' },
  section: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeline: { gap: spacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  body: { fontSize: typography.fontSize.md, lineHeight: 22 },
  meta: { fontSize: typography.fontSize.sm },
  shot: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
});
