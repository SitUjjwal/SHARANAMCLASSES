/**
 * SupportScreen — support tickets hub.
 */
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import {
  SupportTicket,
  type SupportTicketData,
} from '@/modules/feedback/components/SupportTicket';
import { fetchSupportTickets } from '@/modules/feedback/services/supportService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Support'>;

export function SupportScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [items, setItems] = useState<SupportTicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchSupportTickets());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load tickets'));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <LoadingOverlay visible={loading} message="Loading support…" />
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
          <Text style={[styles.title, { color: theme.textPrimary }]}>Support</Text>
          <View style={styles.actions}>
            <AppButton
              label="Contact us"
              onPress={() => navigation.navigate('ContactUs')}
            />
            <AppButton
              label="Chat"
              variant="ghost"
              onPress={() => navigation.navigate('ChatSupport', {})}
            />
          </View>

          {items.length === 0 ? (
            <EmptyState
              icon="help-buoy-outline"
              title="No tickets yet"
              message="Contact us or start a chat when you need help."
            />
          ) : (
            <View style={styles.list}>
              {items.map((ticket) => (
                <SupportTicket
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() =>
                    navigation.navigate('ChatSupport', { ticketId: ticket.id })
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
  actions: { gap: spacing.sm },
  list: { gap: spacing.sm },
});
