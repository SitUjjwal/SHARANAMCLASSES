/**
 * MyFeedbackScreen — list student's feedback tickets + status.
 */
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { FeedbackTicketCard } from '@/modules/feedback/components/FeedbackTicketCard';
import { fetchMyFeedbackTickets } from '@/modules/feedback/services/feedbackService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { FeedbackTicket } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'MyFeedback'>;

export function MyFeedbackScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [items, setItems] = useState<FeedbackTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchMyFeedbackTickets());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load feedback'));
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
      <LoadingOverlay visible={loading} message="Loading tickets…" />
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
          <Text style={[styles.title, { color: theme.textPrimary }]}>My feedback</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Track ticket status for every submission.
          </Text>
          <AppButton
            label="Submit feedback"
            onPress={() => navigation.navigate('SubmitFeedback', {})}
          />

          {items.length === 0 ? (
            <EmptyState
              icon="chatbox-ellipses-outline"
              title="No tickets yet"
              message="Submit feedback and track it here."
            />
          ) : (
            <View style={styles.list}>
              {items.map((ticket) => (
                <FeedbackTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() =>
                    navigation.navigate('FeedbackDetail', { feedbackId: ticket.id })
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
  title: { fontSize: typography.fontSize.xxl, fontWeight: '700' },
  subtitle: { fontSize: typography.fontSize.md },
  list: { gap: spacing.sm },
});
