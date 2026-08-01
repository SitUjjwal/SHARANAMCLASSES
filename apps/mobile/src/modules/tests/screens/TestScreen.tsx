/**
 * TestScreen — take a timed MCQ attempt one question at a time.
 *
 * Composition
 * -----------
 * Timer · TestProgressBar · QuestionCard · TestActionBar · QuestionPalette
 * + useAutoSaveAnswers (debounced server persist)
 * + Timer auto-submit / background pause credit
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Timer } from '@/components/ui/timer';
import { AppButton } from '@/components/ui/AppButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { QuestionCard } from '@/modules/tests/components/QuestionCard';
import { QuestionPalette } from '@/modules/tests/components/QuestionPalette';
import { TestActionBar } from '@/modules/tests/components/TestActionBar';
import { TestProgressBar } from '@/modules/tests/components/TestProgressBar';
import { useAttemptSessionQuery } from '@/modules/tests/hooks/useAttemptSessionQuery';
import { useAutoSaveAnswers } from '@/modules/tests/hooks/useAutoSaveAnswers';
import {
  answersToMap,
  countAnswered,
  ensureAnswerSlots,
  type AnswerMap,
} from '@/modules/tests/utils/answers';
import {
  creditAttemptPause,
  submitAttempt,
} from '@/services/test.service';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';
import type { QuestionCorrectAnswer } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'TestAttempt'>;

export function TestScreen({ navigation, route }: Props) {
  const { attemptId } = route.params;
  const insets = useSafeAreaInsets();
  const sessionQuery = useAttemptSessionQuery(attemptId);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [expired, setExpired] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!sessionQuery.data || hydrated) return;
    const session = sessionQuery.data;
    setAnswers(
      ensureAnswerSlots(
        session.questions,
        answersToMap(session.answers),
      ),
    );
    setIndex(
      Math.min(
        session.attempt.current_question_index,
        Math.max(0, session.questions.length - 1),
      ),
    );
    setEndsAt(session.attempt.ends_at);
    if (session.attempt.status !== 'in_progress') {
      setExpired(true);
    }
    setHydrated(true);
  }, [hydrated, sessionQuery.data]);

  const questions = useMemo(
    () => sessionQuery.data?.questions ?? [],
    [sessionQuery.data?.questions],
  );
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);
  const current = questions[index];
  const draft = current
    ? answers[current.id] ?? {
        selected_answer: null,
        is_marked_for_review: false,
      }
    : null;

  const answeredCount = useMemo(
    () => countAnswered(answers, questionIds),
    [answers, questionIds],
  );

  const active =
    hydrated &&
    !expired &&
    sessionQuery.data?.attempt.status === 'in_progress';

  const { saveState, errorMessage, flush } = useAutoSaveAnswers({
    attemptId,
    questionIds,
    answers,
    currentIndex: index,
    enabled: active,
  });

  const onLowTimeWarning = useCallback(() => {
    Alert.alert(
      'Low time',
      'Less than 5 minutes remaining. Answers keep auto-saving.',
    );
  }, []);

  const onPauseCredit = useCallback(
    (pausedMs: number) => {
      if (!active || pausedMs < 500) return;
      void (async () => {
        try {
          const attempt = await creditAttemptPause(attemptId, pausedMs);
          setEndsAt(attempt.ends_at);
        } catch {
          // Client timer already paused locally; server credit is best-effort
        }
      })();
    },
    [active, attemptId],
  );

  const onAutoSubmit = useCallback(() => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setExpired(true);
    void (async () => {
      try {
        await flush();
        await submitAttempt(attemptId, 'auto');
        navigation.replace('TestResult', { attemptId });
      } catch (err) {
        Alert.alert(
          'Time up',
          getApiErrorMessage(
            err,
            'Answers were saved. Submit may have failed — reopen the test.',
          ),
        );
      }
    })();
  }, [attemptId, flush, navigation]);

  const onManualSubmit = useCallback(() => {
    if (submittingRef.current || !active) return;
    Alert.alert('Submit test?', 'You cannot change answers after submitting.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        style: 'destructive',
        onPress: () => {
          submittingRef.current = true;
          setExpired(true);
          void (async () => {
            try {
              await flush();
              await submitAttempt(attemptId, 'manual');
              navigation.replace('TestResult', { attemptId });
            } catch (err) {
              submittingRef.current = false;
              setExpired(false);
              Alert.alert(
                'Submit failed',
                getApiErrorMessage(err, 'Could not submit. Try again.'),
              );
            }
          })();
        },
      },
    ]);
  }, [active, attemptId, flush, navigation]);

  const updateCurrent = useCallback(
    (
      patch: Partial<{
        selected_answer: QuestionCorrectAnswer | null;
        is_marked_for_review: boolean;
      }>,
    ) => {
      if (!current || !active) return;
      setAnswers((prev) => {
        const existing = prev[current.id] ?? {
          selected_answer: null,
          is_marked_for_review: false,
        };
        return {
          ...prev,
          [current.id]: { ...existing, ...patch },
        };
      });
    },
    [active, current],
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      setIndex(Math.max(0, Math.min(questions.length - 1, nextIndex)));
    },
    [questions.length],
  );

  if (sessionQuery.isLoading && !sessionQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={28} width="60%" />
        <SkeletonBlock height={12} />
        <SkeletonBlock height={180} />
        <SkeletonBlock height={48} />
      </Screen>
    );
  }

  if (
    sessionQuery.isError ||
    !sessionQuery.data ||
    !current ||
    !draft ||
    !endsAt
  ) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(
            sessionQuery.error,
            'Couldn’t load this test attempt.',
          )}
          onRetry={() => {
            void sessionQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const attempt = sessionQuery.data.attempt;

  return (
    <Screen style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(0, insets.top - 8) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close test"
          onPress={() => {
            void flush().finally(() => navigation.goBack());
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.surface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {attempt.test_title}
          </Text>
          <Text style={styles.saveHint}>
            {saveState === 'saving'
              ? 'Saving…'
              : saveState === 'saved'
                ? 'Saved'
                : saveState === 'error'
                  ? errorMessage ?? 'Save failed'
                  : 'Auto-save on'}
          </Text>
        </View>
        <Timer
          endsAt={endsAt}
          enabled={active}
          pauseInBackground
          warningThresholdSeconds={5 * 60}
          onLowTimeWarning={onLowTimeWarning}
          onAutoSubmit={onAutoSubmit}
          onPauseCredit={onPauseCredit}
        />
      </View>

      <TestProgressBar answered={answeredCount} total={questions.length} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <QuestionCard
          index={index}
          total={questions.length}
          question={current}
          selectedAnswer={draft.selected_answer}
          disabled={!active}
          onSelect={(key) => updateCurrent({ selected_answer: key })}
        />

        <TestActionBar
          canGoPrev={index > 0}
          canGoNext={index < questions.length - 1}
          isMarked={draft.is_marked_for_review}
          hasAnswer={draft.selected_answer != null}
          disabled={!active}
          onPrev={() => goTo(index - 1)}
          onNext={() => goTo(index + 1)}
          onToggleMark={() =>
            updateCurrent({ is_marked_for_review: !draft.is_marked_for_review })
          }
          onClear={() => updateCurrent({ selected_answer: null })}
        />

        <QuestionPalette
          total={questions.length}
          currentIndex={index}
          answers={answers}
          questionIds={questionIds}
          onJump={goTo}
        />

        <AppButton
          label="Submit test"
          disabled={!active}
          onPress={onManualSubmit}
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
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  saveHint: {
    marginTop: 2,
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
