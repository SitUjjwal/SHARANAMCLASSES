/**
 * SubjectListScreen — subjects inside a purchased batch.
 *
 * Flow (batch architecture):
 *   CourseDetail / My Courses → SubjectList { batchId, batchTitle }
 *                              → ChapterList { courseId, batchSubjectId, subjectName }
 * Data: GET /student/batches/:batchId/subjects
 * Legacy courses (no subjects) never reach this screen.
 */
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StudentBatchSubject } from '@sharanam/shared';

import { SubjectCard } from '@/modules/subjects/components/SubjectCard';
import { useBatchSubjectsQuery } from '@/modules/subjects/hooks/useBatchSubjectsQuery';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'SubjectList'>;

export function SubjectListScreen({ navigation, route }: Props) {
  const { batchId, batchTitle } = route.params;
  const insets = useSafeAreaInsets();
  const subjectsQuery = useBatchSubjectsQuery(batchId);

  function openSubject(subject: StudentBatchSubject) {
    navigation.navigate('ChapterList', {
      courseId: batchId,
      courseTitle: batchTitle,
      batchSubjectId: subject.id,
      subjectName: subject.name,
    });
  }

  return (
    <Screen style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.surface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Subjects</Text>
          {batchTitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {batchTitle}
            </Text>
          ) : null}
        </View>
      </View>

      {subjectsQuery.isLoading && !subjectsQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={124} radius={16} />
          <SkeletonBlock height={124} radius={16} />
          <SkeletonBlock height={124} radius={16} />
        </View>
      ) : null}

      {subjectsQuery.isError && !subjectsQuery.data ? (
        <ErrorState
          message={getApiErrorMessage(subjectsQuery.error)}
          onRetry={() => {
            void subjectsQuery.refetch();
          }}
        />
      ) : null}

      {subjectsQuery.data ? (
        <FlatList
          data={subjectsQuery.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => <SubjectCard subject={item} onPress={openSubject} />}
          ListEmptyComponent={
            <EmptyState
              icon="library-outline"
              title="No subjects yet"
              message="Subjects will appear here when published."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={subjectsQuery.isRefetching}
              onRefresh={() => {
                void subjectsQuery.refetch();
              }}
              tintColor={colors.accent}
            />
          }
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  sep: {
    height: spacing.md,
  },
  skeleton: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
