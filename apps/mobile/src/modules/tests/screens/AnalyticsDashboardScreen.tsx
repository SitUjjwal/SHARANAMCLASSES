/**
 * AnalyticsDashboardScreen — Test Series performance overview.
 *
 * Average score · Total tests · Pass % · Strong/Weak subjects
 * Recent activity · Score trend + subject charts
 */
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { AnalyticsSummaryCards } from '@/modules/tests/components/AnalyticsSummaryCards';
import { RecentActivityList } from '@/modules/tests/components/RecentActivityList';
import { ScoreTrendChart } from '@/modules/tests/components/ScoreTrendChart';
import { SubjectBarsChart } from '@/modules/tests/components/SubjectBarsChart';
import { SubjectStrengthList } from '@/modules/tests/components/SubjectStrengthList';
import { useAnalyticsQuery } from '@/modules/tests/hooks/useAnalyticsQuery';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TestAnalytics'>;

export function AnalyticsDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const analyticsQuery = useAnalyticsQuery();

  if (analyticsQuery.isLoading && !analyticsQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={28} width="50%" />
        <SkeletonBlock height={90} />
        <SkeletonBlock height={120} />
        <SkeletonBlock height={160} />
      </Screen>
    );
  }

  if (analyticsQuery.isError && !analyticsQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(
            analyticsQuery.error,
            'Couldn’t load analytics.',
          )}
          onRetry={() => {
            void analyticsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const data = analyticsQuery.data!;

  return (
    <Screen style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(0, insets.top - 8) }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.surface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Performance</Text>
          <Text style={styles.title}>Analytics</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={analyticsQuery.isRefetching}
            onRefresh={() => {
              void analyticsQuery.refetch();
            }}
            tintColor={colors.accent}
          />
        }
      >
        <AnalyticsSummaryCards summary={data.summary} />

        <SubjectStrengthList
          title="Strong subjects"
          items={data.strong_subjects}
          tone="strong"
        />
        <SubjectStrengthList
          title="Weak subjects"
          items={data.weak_subjects}
          tone="weak"
        />

        <ScoreTrendChart series={data.charts.score_over_time} />
        <SubjectBarsChart items={data.charts.by_subject} />

        <RecentActivityList
          items={data.recent_activity}
          onOpenResult={(attemptId) =>
            navigation.navigate('TestResult', { attemptId })
          }
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
