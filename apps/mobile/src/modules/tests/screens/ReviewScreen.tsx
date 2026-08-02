/**
 * ReviewScreen — scrollable post-attempt answer review.
 *
 * Route: TestReview { attemptId }
 * Entry: ResultScreen → "Review Answers"
 *
 * Each card: Question · Selected · Correct · Explanation
 * Green = correct · Red = wrong · Muted = skipped
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { ReviewQuestionCard } from '@/modules/tests/components/ReviewQuestionCard';
import { useAttemptResultQuery } from '@/modules/tests/hooks/useAttemptResultQuery';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TestReview'>;

export function ReviewScreen({ navigation, route }: Props) {
  const { attemptId } = route.params;
  const insets = useSafeAreaInsets();
  const resultQuery = useAttemptResultQuery(attemptId);

  if (resultQuery.isLoading && !resultQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={28} width="40%" />
        <SkeletonBlock height={160} />
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
            'Couldn’t load answer review.',
          )}
          onRetry={() => {
            void resultQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const { summary, review } = resultQuery.data;

  return (
    <Screen style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(0, insets.top - 8) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.surface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Review</Text>
          <Text style={styles.title} numberOfLines={1}>
            {summary.test_title}
          </Text>
          <Text style={styles.meta}>
            {summary.correct_count} correct · {summary.wrong_count} wrong ·{' '}
            {summary.skipped_count} skipped
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {review.length === 0 ? (
          <EmptyState
            title="No questions"
            message="This attempt has no questions to review."
          />
        ) : (
          review.map((item, index) => (
            <ReviewQuestionCard
              key={item.question_id}
              index={index}
              item={item}
              onReport={() =>
                navigation.navigate('ReportContent', {
                  report_type: 'incorrect_question',
                  target_type: 'question',
                  target_id: item.question_id,
                  target_label: `Q${index + 1}: ${item.question_text.slice(0, 80)}`,
                })
              }
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

/** Alias kept for existing imports */
export { ReviewScreen as ReviewAnswersScreen };

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  meta: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  scroll: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});
