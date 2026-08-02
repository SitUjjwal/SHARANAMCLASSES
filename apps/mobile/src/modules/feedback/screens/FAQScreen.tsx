/**
 * FAQScreen — searchable published FAQs.
 */
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppTextField } from '@/components/ui/AppTextField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { FAQItem } from '@/modules/feedback/components/FAQItem';
import { fetchFaqs } from '@/modules/feedback/services/faqService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { Faq } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'FAQ'>;

export function FAQScreen(_props: Props) {
  const theme = useAppTheme();
  const [items, setItems] = useState<Faq[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async (search: string) => {
    setError(null);
    try {
      setItems(await fetchFaqs(search));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load FAQs'));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load(debouncedQuery);
  }, [debouncedQuery, load]);

  return (
    <Screen>
      <LoadingOverlay visible={loading && !refreshing} message="Loading FAQ…" />
      {error && !loading && items.length === 0 ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            void load(debouncedQuery);
          }}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(debouncedQuery);
            }}
            tintColor={theme.accent}
          />
        }
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>FAQ</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Search common questions about courses, payments, and your account.
        </Text>

        <AppTextField
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search questions…"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {!loading && items.length === 0 ? (
          <EmptyState
            icon="help-circle-outline"
            title={debouncedQuery ? 'No matches' : 'No FAQs yet'}
            message={
              debouncedQuery
                ? 'Try a different search term.'
                : 'Check back soon — we are adding help articles.'
            }
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <FAQItem
                key={item.id}
                item={{
                  id: item.id,
                  question: item.question,
                  answer: item.answer,
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: typography.fontSize.xxl, fontWeight: '700' },
  subtitle: { fontSize: typography.fontSize.md },
  list: { gap: spacing.sm },
});
