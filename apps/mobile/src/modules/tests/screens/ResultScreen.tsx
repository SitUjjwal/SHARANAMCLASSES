/**
 * ResultScreen — scored attempt summary.
 *
 * Shows total/obtained marks, correct/wrong/skipped, percentage,
 * pass/fail, performance chart, and Review Answers CTA.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { PassFailBadge } from '@/modules/tests/components/PassFailBadge';
import { PerformanceChart } from '@/modules/tests/components/PerformanceChart';
import { ResultStatGrid } from '@/modules/tests/components/ResultStatGrid';
import { useAttemptResultQuery } from '@/modules/tests/hooks/useAttemptResultQuery';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TestResult'>;

export function ResultScreen({ navigation, route }: Props) {
  const { attemptId } = route.params;
  const insets = useSafeAreaInsets();
  const resultQuery = useAttemptResultQuery(attemptId);

  if (resultQuery.isLoading && !resultQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={28} width="50%" />
        <SkeletonBlock height={100} />
        <SkeletonBlock height={120} />
        <SkeletonBlock height={160} />
      </Screen>
    );
  }

  if (resultQuery.isError || !resultQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(
            resultQuery.error,
            'Couldn’t load your result.',
          )}
          onRetry={() => {
            void resultQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const { summary } = resultQuery.data;

  return (
    <Screen style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(0, insets.top - 8) }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate('MainTabs', {
              screen: 'Tabs',
              params: { screen: 'TestsTab' },
            })
          }
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.surface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Result</Text>
          <Text style={styles.title} numberOfLines={2}>
            {summary.test_title}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <PassFailBadge
          isPassed={summary.is_passed}
          passingMarks={summary.passing_marks}
          obtainedMarks={summary.obtained_marks}
        />

        <ResultStatGrid summary={summary} />

        <PerformanceChart
          correct={summary.correct_count}
          wrong={summary.wrong_count}
          skipped={summary.skipped_count}
        />

        <AppButton
          label="Review Answers"
          onPress={() =>
            navigation.navigate('TestReview', { attemptId: summary.attempt_id })
          }
        />

        <AppButton
          label="Back to Test Series"
          variant="ghost"
          onPress={() =>
            navigation.navigate('MainTabs', {
              screen: 'Tabs',
              params: { screen: 'TestsTab' },
            })
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
    minWidth: 0,
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
