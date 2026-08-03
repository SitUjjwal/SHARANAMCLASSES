/**
 * TestListScreen — published tests; Start opens (or resumes) an attempt.
 */
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useStudentTestsQuery } from '@/modules/tests/hooks/useStudentTestsQuery';
import { startOrResumeAttempt } from '@/services/test.service';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';
import { TEST_TYPE_LABELS, type TestPublic } from '@sharanam/shared';

type Props = {
  navigation: NavigationProp<AppStackParamList>;
  /** Hide back when shown as a main tab */
  hideBack?: boolean;
};

export function TestListScreen({ navigation, hideBack = false }: Props) {
  const insets = useSafeAreaInsets();
  const testsQuery = useStudentTestsQuery();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const onStart = useCallback(
    async (test: TestPublic) => {
      if (test.is_locked) {
        setStartError('This test is locked. Enroll in the course to unlock it.');
        return;
      }
      setStartError(null);
      setStartingId(test.id);
      try {
        const session = await startOrResumeAttempt(test.id);
        navigation.navigate('TestAttempt', {
          attemptId: session.attempt.id,
          testId: test.id,
        });
      } catch (err) {
        setStartError(
          getApiErrorMessage(err, 'Could not start this test. Try again.'),
        );
      } finally {
        setStartingId(null);
      }
    },
    [navigation],
  );

  if (testsQuery.isLoading && !testsQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={28} width="40%" />
        <SkeletonBlock height={100} />
        <SkeletonBlock height={100} />
      </Screen>
    );
  }

  if (testsQuery.isError && !testsQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(testsQuery.error, 'Couldn’t load tests.')}
          onRetry={() => {
            void testsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const items = testsQuery.data ?? [];

  return (
    <Screen style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(0, insets.top - 8) }]}>
        {!hideBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </Pressable>
        ) : null}
        <Text style={styles.title}>Test Series</Text>
      </View>

      {startError ? <Text style={styles.error}>{startError}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(test) => test.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={testsQuery.isRefetching}
            onRefresh={() => {
              void testsQuery.refetch();
            }}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState title="No tests yet" message="Published tests will appear here." />
        }
        renderItem={({ item: test }) => {
          const busy = startingId === test.id;
          return (
            <View style={styles.card}>
              <Text style={styles.cardType}>{TEST_TYPE_LABELS[test.test_type]}</Text>
              <Text style={styles.cardTitle}>{test.title}</Text>
              <Text style={styles.cardMeta}>
                {test.duration_minutes} min · {test.total_marks} marks
                {test.is_locked ? ' · Locked' : ''}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={busy || test.is_locked}
                onPress={() => {
                  void onStart(test);
                }}
                style={({ pressed }) => [
                  styles.startBtn,
                  test.is_locked ? styles.startLocked : null,
                  pressed && !busy && !test.is_locked ? styles.pressed : null,
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.startLabel}>
                    {test.is_locked ? 'Locked' : 'Start / Resume'}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        }}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
      />
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
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  error: {
    color: '#F28B82',
    fontSize: typography.fontSize.sm,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardType: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardTitle: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  cardMeta: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  startBtn: {
    marginTop: spacing.xs,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  startLocked: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pressed: {
    opacity: 0.9,
  },
  startLabel: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.fontSize.md,
  },
});
