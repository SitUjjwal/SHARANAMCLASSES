/**
 * TestHistoryScreen — past attempts: name, date, score, %, rank, View Result.
 *
 * APIs: GET /test-history → list; View Result → TestResult (GET /results/:id)
 */
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { TestHistoryCard } from '@/modules/profile/components/TestHistoryCard';
import { useTestHistoryQuery } from '@/modules/profile/hooks/useTestHistoryQuery';
import type { AppStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TestHistory'>;

export function TestHistoryScreen({ navigation }: Props) {
  const historyQuery = useTestHistoryQuery(1);
  const items = historyQuery.data?.items ?? [];
  const showLoading = historyQuery.isPending && !historyQuery.data;

  return (
    <Screen>
      <LoadingOverlay visible={showLoading} message="Loading test history…" />

      {historyQuery.isError && !historyQuery.data ? (
        <ErrorState
          message={
            historyQuery.error instanceof Error
              ? historyQuery.error.message
              : 'Failed to load test history'
          }
          onRetry={() => {
            void historyQuery.refetch();
          }}
        />
      ) : null}

      {historyQuery.data ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={historyQuery.isRefetching && !showLoading}
              onRefresh={() => {
                void historyQuery.refetch();
              }}
              tintColor={colors.accent}
            />
          }
        >
          <Text style={styles.title}>Test History</Text>
          <Text style={styles.subtitle}>
            Your scored attempts with rank on each test.
          </Text>

          {items.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="No attempts yet"
              message="Take a test to see results here."
            />
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <TestHistoryCard
                  key={item.attempt_id}
                  item={item}
                  onViewResult={() =>
                    navigation.navigate('TestResult', {
                      attemptId: item.attempt_id,
                    })
                  }
                />
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
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    marginTop: -spacing.xs,
  },
  list: { gap: spacing.sm },
});
