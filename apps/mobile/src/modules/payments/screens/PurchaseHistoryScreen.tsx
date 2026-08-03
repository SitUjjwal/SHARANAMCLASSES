/**
 * PurchaseHistoryScreen — modern payments hub with infinite list.
 */
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { PurchaseHistoryRow } from '@/modules/payments/components/PurchaseHistoryRow';
import { usePurchaseHistoryInfiniteQuery } from '@/modules/payments/hooks/usePurchaseHistoryInfiniteQuery';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'PurchaseHistory'>;

function PurchasesEmpty() {
  const theme = useAppTheme();
  const isDark = theme.canvas === '#0B1F3A';

  return (
    <View
      style={[
        styles.empty,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={styles.emptyGlow} pointerEvents="none">
        <View style={[styles.emptyOrb, { backgroundColor: colors.accent }]} />
      </View>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: isDark ? 'rgba(201,162,39,0.16)' : 'rgba(201,162,39,0.12)' },
        ]}
      >
        <Ionicons name="receipt-outline" size={28} color={colors.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No purchases yet</Text>
      <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
        Paid course purchases will appear here with downloadable receipts.
      </Text>
    </View>
  );
}

export function PurchaseHistoryScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const historyQuery = usePurchaseHistoryInfiniteQuery(20);
  const items = useMemo(
    () => historyQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [historyQuery.data],
  );
  const total = historyQuery.data?.pages[0]?.total ?? items.length;

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
          <Text style={[styles.backLabel, { color: theme.textPrimary }]}>Back</Text>
        </Pressable>

        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Purchase History</Text>
          {items.length > 0 ? (
            <View style={[styles.countChip, { backgroundColor: 'rgba(201,162,39,0.18)' }]}>
              <Text style={styles.countChipText}>
                {total > 99 ? '99+' : total} order{total === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your Razorpay course payments & receipts
        </Text>
      </View>

      {historyQuery.isLoading && !historyQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={168} radius={20} />
          <SkeletonBlock height={168} radius={20} />
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
          ListEmptyComponent={<PurchasesEmpty />}
          renderItem={({ item }) => <PurchaseHistoryRow item={item} />}
          refreshing={historyQuery.isRefetching && !historyQuery.isFetchingNextPage}
          onRefresh={() => {
            void historyQuery.refetch();
          }}
          onEndReached={() => {
            if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) {
              void historyQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            historyQuery.isFetchingNextPage ? (
              <ActivityIndicator color={colors.accent} style={styles.footer} />
            ) : null
          }
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
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
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  backLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  countChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countChipText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
    marginTop: -spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
  sep: {
    height: spacing.sm,
  },
  skeleton: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  footer: {
    marginVertical: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl + spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  emptyGlow: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  emptyOrb: {
    position: 'absolute',
    top: -36,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
});
