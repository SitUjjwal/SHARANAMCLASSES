/**
 * LeaderboardScreen — Top 100 students by score.
 *
 * Filters: Course · Test · Date (YYYY-MM-DD)
 * Columns: Rank · Name · Score · Percentage · Time taken
 */
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useCourseListInfiniteQuery } from '@/modules/courses/hooks/useCourseListInfiniteQuery';
import { LeaderboardRow } from '@/modules/tests/components/LeaderboardRow';
import { useLeaderboardQuery } from '@/modules/tests/hooks/useLeaderboardQuery';
import { useStudentTestsQuery } from '@/modules/tests/hooks/useStudentTestsQuery';
import { useAuth } from '@/hooks/useAuth';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Leaderboard'>;

function todayYmd(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function LeaderboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [courseId, setCourseId] = useState<string | undefined>();
  const [testId, setTestId] = useState<string | undefined>();
  const [date, setDate] = useState<string>('');
  const [dateDraft, setDateDraft] = useState<string>('');

  const filters = useMemo(
    () => ({
      courseId,
      testId,
      date: date || undefined,
      limit: 100,
    }),
    [courseId, date, testId],
  );

  const leaderboardQuery = useLeaderboardQuery(filters);
  const coursesQuery = useCourseListInfiniteQuery({ pageSize: 50 });
  const testsQuery = useStudentTestsQuery(courseId);

  const courses = useMemo(() => {
    const pages = coursesQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.items);
  }, [coursesQuery.data?.pages]);

  const tests = testsQuery.data ?? [];

  if (leaderboardQuery.isLoading && !leaderboardQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={28} width="45%" />
        <SkeletonBlock height={72} />
        <SkeletonBlock height={56} />
        <SkeletonBlock height={56} />
      </Screen>
    );
  }

  if (leaderboardQuery.isError && !leaderboardQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(
            leaderboardQuery.error,
            'Couldn’t load leaderboard.',
          )}
          onRetry={() => {
            void leaderboardQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const items = leaderboardQuery.data?.items ?? [];

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
          <Text style={styles.eyebrow}>Top 100</Text>
          <Text style={styles.title}>Leaderboard</Text>
        </View>
      </View>

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Course</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            <FilterChip
              label="All courses"
              active={!courseId}
              onPress={() => {
                setCourseId(undefined);
                setTestId(undefined);
              }}
            />
            {courses.map((c) => (
              <FilterChip
                key={c.id}
                label={c.title}
                active={courseId === c.id}
                onPress={() => {
                  setCourseId(c.id);
                  setTestId(undefined);
                }}
              />
            ))}
          </View>
        </ScrollView>

        <Text style={styles.filterLabel}>Test</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            <FilterChip
              label="All tests"
              active={!testId}
              onPress={() => setTestId(undefined)}
            />
            {tests.map((t) => (
              <FilterChip
                key={t.id}
                label={t.title}
                active={testId === t.id}
                onPress={() => setTestId(t.id)}
              />
            ))}
          </View>
        </ScrollView>

        <Text style={styles.filterLabel}>Date (YYYY-MM-DD)</Text>
        <View style={styles.dateRow}>
          <TextInput
            value={dateDraft}
            onChangeText={setDateDraft}
            placeholder="e.g. 2026-08-01"
            placeholderTextColor="#7A8799"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.dateInput}
            onSubmitEditing={() => {
              const next = dateDraft.trim();
              if (!next || /^\d{4}-\d{2}-\d{2}$/.test(next)) {
                setDate(next);
              }
            }}
          />
          <Pressable
            style={styles.dateBtn}
            onPress={() => {
              const next = dateDraft.trim();
              if (!next || /^\d{4}-\d{2}-\d{2}$/.test(next)) {
                setDate(next);
              }
            }}
          >
            <Text style={styles.dateBtnLabel}>Apply</Text>
          </Pressable>
          <Pressable
            style={styles.dateBtnGhost}
            onPress={() => {
              const t = todayYmd();
              setDateDraft(t);
              setDate(t);
            }}
          >
            <Text style={styles.dateBtnGhostLabel}>Today</Text>
          </Pressable>
          {date ? (
            <Pressable
              style={styles.dateBtnGhost}
              onPress={() => {
                setDate('');
                setDateDraft('');
              }}
            >
              <Text style={styles.dateBtnGhostLabel}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.attempt_id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={leaderboardQuery.isRefetching}
            onRefresh={() => {
              void leaderboardQuery.refetch();
            }}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No rankings yet"
            message="Complete scored tests to appear on the leaderboard."
          />
        }
        renderItem={({ item }) => (
          <LeaderboardRow
            entry={item}
            highlight={Boolean(user?.id && item.user_id === user.id)}
          />
        )}
      />
    </Screen>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
    >
      <Text
        style={[styles.chipLabel, active ? styles.chipLabelActive : null]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
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
  filters: {
    gap: spacing.sm,
  },
  filterLabel: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chip: {
    maxWidth: 180,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(201,162,39,0.2)',
  },
  chipLabel: {
    color: '#A8B3C5',
    fontWeight: '600',
    fontSize: typography.fontSize.sm,
  },
  chipLabelActive: {
    color: colors.accent,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  dateInput: {
    flexGrow: 1,
    minWidth: 140,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
  },
  dateBtn: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  dateBtnLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  dateBtnGhost: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dateBtnGhostLabel: {
    color: colors.surface,
    fontWeight: '600',
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
