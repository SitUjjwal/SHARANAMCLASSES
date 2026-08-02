/**
 * ReviewScreen — create / edit / delete a course review (1–5 stars).
 * One review per course; edits return to pending approval.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { RatingStars } from '@/modules/feedback/components/RatingStars';
import {
  deleteReview,
  fetchMyReview,
  submitReview,
  updateReview,
} from '@/modules/feedback/services/reviewService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { CourseReview } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'AppReview'>;

function statusHint(status: CourseReview['status']): string {
  switch (status) {
    case 'approved':
      return 'Published on the course page.';
    case 'rejected':
      return 'Rejected by admin. Edit and resubmit.';
    default:
      return 'Waiting for admin approval before it appears publicly.';
  }
}

export function ReviewScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const courseId = route.params?.courseId;
  const [existing, setExisting] = useState<CourseReview | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(Boolean(courseId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const loadMine = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const mine = await fetchMyReview(courseId);
      setExisting(mine);
      if (mine) {
        setRating(mine.rating);
        setComment(mine.comment);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your review'));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  async function onSubmit() {
    if (!courseId) {
      setError('Open Write a review from a course page.');
      return;
    }
    setError(null);
    if (rating < 1 || rating > 5) {
      setError('Please choose a star rating from 1 to 5.');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Review must be at least 10 characters.');
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        const updated = await updateReview(existing.id, {
          rating,
          comment: comment.trim(),
        });
        setExisting(updated);
      } else {
        const created = await submitReview({
          course_id: courseId,
          rating,
          comment: comment.trim(),
        });
        setExisting(created);
      }
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit review'));
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    if (!existing) return;
    Alert.alert('Delete review?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            setError(null);
            try {
              await deleteReview(existing.id);
              navigation.goBack();
            } catch (err) {
              setError(getApiErrorMessage(err, 'Could not delete review'));
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  }

  if (!courseId) {
    return (
      <Screen>
        <View style={styles.scroll}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Write a review
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Open any course and tap Write a review to rate that course.
          </Text>
          <AppButton label="Go back" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <LoadingOverlay
        visible={loading || saving}
        message={loading ? 'Loading…' : 'Saving…'}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {existing ? 'Edit your review' : 'Write a review'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Rate this course from 1 to 5 stars. One review per course.
        </Text>

        {existing ? (
          <Text style={[styles.status, { color: theme.textSecondary }]}>
            Status: {existing.status.replace('_', ' ')} — {statusHint(existing.status)}
          </Text>
        ) : null}

        <Text style={[styles.label, { color: theme.textSecondary }]}>Rating</Text>
        <RatingStars value={rating} onChange={setRating} />

        <View style={styles.form}>
          <AppTextField
            label="Your review"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            placeholder="What did you like? What can we improve?"
          />
          <ErrorMessage message={error} />
          {done ? (
            <Text style={[styles.success, { color: theme.success }]}>
              {existing?.status === 'pending_approval'
                ? 'Saved — pending admin approval.'
                : 'Saved.'}
            </Text>
          ) : null}
          <AppButton
            label={
              done
                ? 'Done'
                : existing
                  ? 'Save changes'
                  : 'Submit review'
            }
            onPress={() => {
              if (done) navigation.goBack();
              else void onSubmit();
            }}
            loading={saving}
          />
          {existing && !done ? (
            <AppButton
              label="Delete review"
              variant="ghost"
              onPress={onDelete}
              disabled={saving}
            />
          ) : null}
          <AppButton label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: typography.fontSize.xxl, fontWeight: '700' },
  subtitle: { fontSize: typography.fontSize.md, marginBottom: spacing.sm },
  status: { fontSize: typography.fontSize.sm, lineHeight: 18 },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  form: { gap: spacing.md },
  success: { fontSize: typography.fontSize.md, fontWeight: '600' },
});
