/**
 * PurchaseHistoryScreen
 *
 * Lists: Course · Amount · Date · Payment ID · Status · Download Receipt
 */
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { PurchaseHistoryRow } from '@/modules/payments/components/PurchaseHistoryRow';
import { usePurchaseHistoryQuery } from '@/modules/payments/hooks/usePurchaseHistoryQuery';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'PurchaseHistory'>;

export function PurchaseHistoryScreen({ navigation }: Props) {
  const historyQuery = usePurchaseHistoryQuery();
  const items = historyQuery.data?.items ?? [];

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <AppButton label="← Back" variant="ghost" onPress={() => navigation.goBack()} />
        <SectionHeader title="Purchase History" />
        <Text style={styles.subtitle}>Your Razorpay course payments</Text>
      </View>

      {historyQuery.isLoading && !historyQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={160} radius={14} />
          <SkeletonBlock height={160} radius={14} />
        </View>
      ) : null}

      {historyQuery.isError && !historyQuery.data ? (
        <ErrorState
          message={getApiErrorMessage(historyQuery.error)}
          onRetry={() => {
            void historyQuery.refetch();
          }}
        />
      ) : null}

      {historyQuery.data ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.order_id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No purchases yet"
              message="Paid course purchases will appear here with receipts."
            />
          }
          renderItem={({ item }) => <PurchaseHistoryRow item={item} />}
          refreshing={historyQuery.isRefetching}
          onRefresh={() => {
            void historyQuery.refetch();
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    paddingTop: spacing.md,
  },
  sep: {
    height: spacing.md,
  },
  skeleton: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
