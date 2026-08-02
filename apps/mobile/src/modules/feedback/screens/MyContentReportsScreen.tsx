/**
 * MyContentReportsScreen — list submitted content reports + status.
 */
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { fetchMyContentReports } from '@/modules/feedback/services/contentReportService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { ContentReport } from '@sharanam/shared';
import {
  CONTENT_REPORT_STATUS_LABELS,
  CONTENT_REPORT_TYPE_LABELS,
} from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'MyContentReports'>;

export function MyContentReportsScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [items, setItems] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchMyContentReports());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load content reports'));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <LoadingOverlay visible={loading} message="Loading…" />
      {error && !loading ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}

      {!loading ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={theme.accent}
            />
          }
        >
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            My content reports
          </Text>
          <AppButton
            label="Report content"
            onPress={() => navigation.navigate('ReportContent', {})}
          />

          {items.length === 0 ? (
            <EmptyState
              icon="flag-outline"
              title="No content reports"
              message="When you flag incorrect or broken content, track status here."
            />
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    navigation.navigate('ContentReportDetail', {
                      reportId: item.id,
                    })
                  }
                  style={[
                    styles.row,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}
                >
                  <View style={styles.textCol}>
                    <Text style={[styles.ticket, { color: theme.accent }]}>
                      {item.ticket_number}
                    </Text>
                    <Text style={[styles.type, { color: theme.textPrimary }]}>
                      {CONTENT_REPORT_TYPE_LABELS[item.report_type]}
                    </Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>
                      {item.target_label || 'General'} ·{' '}
                      {CONTENT_REPORT_STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                  <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: typography.fontSize.xxl, fontWeight: '700' },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  textCol: { flex: 1, gap: 2 },
  ticket: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  type: { fontSize: typography.fontSize.md, fontWeight: '600' },
  meta: { fontSize: typography.fontSize.sm },
  chevron: { fontSize: 22, fontWeight: '300' },
});
