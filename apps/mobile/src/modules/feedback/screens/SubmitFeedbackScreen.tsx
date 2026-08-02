/**
 * SubmitFeedbackScreen — type + title + message (+ course/teacher) → ticket.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import {
  fetchFeedbackTeachers,
  submitFeedbackTicket,
  type FeedbackTeacherOption,
} from '@/modules/feedback/services/feedbackService';
import { fetchMyCourses } from '@/services/myCourse.service';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { FeedbackType } from '@sharanam/shared';
import { FEEDBACK_TYPE_LABELS } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'SubmitFeedback'>;

const TYPES: FeedbackType[] = [
  'general',
  'course',
  'teacher',
  'suggestion',
  'complaint',
];

export function SubmitFeedbackScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const initialType = route.params?.type ?? 'general';

  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialType);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [teachers, setTeachers] = useState<FeedbackTeacherOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [myCourses, teacherList] = await Promise.all([
        fetchMyCourses().catch(() => ({ items: [] as Array<{ course_id: string; title: string }> })),
        fetchFeedbackTeachers().catch(() => [] as FeedbackTeacherOption[]),
      ]);
      setCourses(
        (myCourses.items ?? []).map((c) => ({
          id: c.course_id,
          title: c.title,
        })),
      );
      setTeachers(teacherList);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    setFeedbackType(initialType);
  }, [initialType]);

  async function onSubmit() {
    setError(null);
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Message must be at least 10 characters.');
      return;
    }
    if (feedbackType === 'course' && !courseId) {
      setError('Select a course.');
      return;
    }
    if (feedbackType === 'teacher' && !teacherId && teacherName.trim().length < 2) {
      setError('Select or enter a teacher name.');
      return;
    }

    setSaving(true);
    try {
      const ticket = await submitFeedbackTicket({
        feedback_type: feedbackType,
        title: title.trim(),
        message: message.trim(),
        course_id: feedbackType === 'course' ? courseId : null,
        teacher_id: feedbackType === 'teacher' ? teacherId : null,
        teacher_name:
          feedbackType === 'teacher' && !teacherId ? teacherName.trim() : null,
      });
      setCreatedId(ticket.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit feedback'));
    } finally {
      setSaving(false);
    }
  }

  if (createdId) {
    return (
      <Screen>
        <View style={styles.scroll}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Submitted</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your feedback ticket was created. Track its status anytime.
          </Text>
          <AppButton
            label="View ticket"
            onPress={() =>
              navigation.replace('FeedbackDetail', { feedbackId: createdId })
            }
          />
          <AppButton
            label="My feedback"
            variant="ghost"
            onPress={() => navigation.navigate('MyFeedback')}
          />
          <AppButton label="Done" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <LoadingOverlay
        visible={saving || loadingMeta}
        message={loadingMeta ? 'Loading…' : 'Submitting…'}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.textPrimary }]}>Submit feedback</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose a type, add a title and message, then submit a ticket.
        </Text>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Feedback type</Text>
        <View style={styles.typeWrap}>
          {TYPES.map((type) => {
            const selected = feedbackType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setFeedbackType(type)}
                style={[
                  styles.typeChip,
                  {
                    borderColor: selected ? theme.accent : theme.cardBorder,
                    backgroundColor: selected ? theme.accent : theme.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    { color: selected ? '#0B1F3A' : theme.textPrimary },
                  ]}
                >
                  {FEEDBACK_TYPE_LABELS[type]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {feedbackType === 'course' ? (
          <View style={styles.pickerBlock}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Course</Text>
            {courses.length === 0 ? (
              <Text style={{ color: theme.textSecondary }}>
                No enrolled courses yet. Enroll first, or pick another feedback type.
              </Text>
            ) : (
              <View style={styles.typeWrap}>
                {courses.map((c) => {
                  const selected = courseId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCourseId(c.id)}
                      style={[
                        styles.typeChip,
                        {
                          borderColor: selected ? theme.accent : theme.cardBorder,
                          backgroundColor: selected ? theme.accent : theme.card,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          { color: selected ? '#0B1F3A' : theme.textPrimary },
                        ]}
                      >
                        {c.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {feedbackType === 'teacher' ? (
          <View style={styles.pickerBlock}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Teacher</Text>
            {teachers.length > 0 ? (
              <View style={styles.typeWrap}>
                {teachers.map((t) => {
                  const selected = teacherId === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => {
                        setTeacherId(t.id);
                        setTeacherName(t.full_name);
                      }}
                      style={[
                        styles.typeChip,
                        {
                          borderColor: selected ? theme.accent : theme.cardBorder,
                          backgroundColor: selected ? theme.accent : theme.card,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          { color: selected ? '#0B1F3A' : theme.textPrimary },
                        ]}
                      >
                        {t.full_name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <AppTextField
              label="Or enter teacher name"
              value={teacherName}
              onChangeText={(v) => {
                setTeacherName(v);
                setTeacherId(null);
              }}
              placeholder="Teacher name"
            />
          </View>
        ) : null}

        <AppTextField
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Short summary"
        />
        <AppTextField
          label="Message"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          placeholder="Describe your feedback in detail"
        />

        <ErrorMessage message={error} />
        <AppButton label="Submit" onPress={() => void onSubmit()} loading={saving} />
        <AppButton label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: typography.fontSize.xxl, fontWeight: '700' },
  subtitle: { fontSize: typography.fontSize.md },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typeChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  pickerBlock: { gap: spacing.sm },
});
