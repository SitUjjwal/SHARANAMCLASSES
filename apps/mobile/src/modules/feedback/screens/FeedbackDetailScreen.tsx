/**
 * FeedbackDetailScreen — track status; edit/delete while open.
 */
import { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import {
  deleteFeedbackTicket,
  fetchFeedbackTicket,
  updateFeedbackTicket,
} from '@/modules/feedback/services/feedbackService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { FeedbackTicket, FeedbackTicketStatus } from '@sharanam/shared';
import {
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TYPE_LABELS,
} from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'FeedbackDetail'>;

const STATUS_ORDER: FeedbackTicketStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function FeedbackDetailScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { feedbackId } = route.params;
  const [ticket, setTicket] = useState<FeedbackTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchFeedbackTicket(feedbackId);
      setTicket(data);
      setTitle(data.title);
      setMessage(data.message);
      setEditing(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load ticket'));
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [feedbackId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const currentIndex = ticket ? STATUS_ORDER.indexOf(ticket.status) : -1;
  const canManage = ticket?.status === 'open';

  async function onSave() {
    setFormError(null);
    if (title.trim().length < 3) {
      setFormError('Title must be at least 3 characters.');
      return;
    }
    if (message.trim().length < 10) {
      setFormError('Message must be at least 10 characters.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateFeedbackTicket(feedbackId, {
        title: title.trim(),
        message: message.trim(),
      });
      setTicket(updated);
      setEditing(false);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not update feedback'));
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    Alert.alert(
      'Delete feedback?',
      'This permanently removes your open ticket.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSaving(true);
              setFormError(null);
              try {
                await deleteFeedbackTicket(feedbackId);
                navigation.navigate('MyFeedback');
              } catch (err) {
                setFormError(getApiErrorMessage(err, 'Could not delete feedback'));
              } finally {
                setSaving(false);
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <LoadingOverlay
        visible={loading || saving}
        message={saving ? 'Saving…' : 'Loading ticket…'}
      />
      {error && !loading ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}

      {!loading && ticket ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => void load()}
              tintColor={theme.accent}
            />
          }
        >
          <Text style={[styles.ticketNo, { color: theme.accent }]}>
            {ticket.ticket_number}
          </Text>
          {!editing ? (
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {ticket.title}
            </Text>
          ) : null}
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {FEEDBACK_TYPE_LABELS[ticket.feedback_type]}
          </Text>

          <Text style={[styles.section, { color: theme.textSecondary }]}>Status</Text>
          <View style={styles.timeline}>
            {STATUS_ORDER.map((status, index) => {
              const reached = index <= currentIndex;
              const isCurrent = ticket.status === status;
              return (
                <View key={status} style={styles.timelineRow}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: reached ? theme.accent : theme.cardBorder,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.timelineLabel,
                      {
                        color: isCurrent ? theme.textPrimary : theme.textSecondary,
                        fontWeight: isCurrent ? '700' : '500',
                      },
                    ]}
                  >
                    {FEEDBACK_STATUS_LABELS[status]}
                  </Text>
                </View>
              );
            })}
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            {editing ? (
              <>
                <AppTextField label="Title" value={title} onChangeText={setTitle} />
                <AppTextField
                  label="Message"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                />
              </>
            ) : (
              <>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
                  Message
                </Text>
                <Text style={[styles.body, { color: theme.textPrimary }]}>
                  {ticket.message}
                </Text>
              </>
            )}
            {ticket.course_title ? (
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                Course: {ticket.course_title}
              </Text>
            ) : null}
            {ticket.teacher_name ? (
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                Teacher: {ticket.teacher_name}
              </Text>
            ) : null}
            {ticket.admin_note ? (
              <>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
                  Admin reply
                </Text>
                <Text style={[styles.body, { color: theme.textPrimary }]}>
                  {ticket.admin_note}
                </Text>
              </>
            ) : null}
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              Submitted {formatDate(ticket.created_at)}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              Updated {formatDate(ticket.updated_at)}
            </Text>
          </View>

          <ErrorMessage message={formError} />

          {canManage && !editing ? (
            <>
              <AppButton label="Edit" onPress={() => setEditing(true)} />
              <AppButton label="Delete" variant="ghost" onPress={onDelete} />
            </>
          ) : null}
          {canManage && editing ? (
            <>
              <AppButton label="Save changes" onPress={() => void onSave()} loading={saving} />
              <AppButton
                label="Cancel"
                variant="ghost"
                onPress={() => {
                  setTitle(ticket.title);
                  setMessage(ticket.message);
                  setFormError(null);
                  setEditing(false);
                }}
              />
            </>
          ) : null}

          <AppButton
            label="Back to my feedback"
            variant={canManage ? 'ghost' : undefined}
            onPress={() => navigation.navigate('MyFeedback')}
          />
          <AppButton label="Close" variant="ghost" onPress={() => navigation.goBack()} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  ticketNo: { fontSize: typography.fontSize.md, fontWeight: '700' },
  title: { fontSize: typography.fontSize.xxl, fontWeight: '700' },
  meta: { fontSize: typography.fontSize.sm },
  section: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  timeline: { gap: spacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  timelineLabel: { fontSize: typography.fontSize.md },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  body: { fontSize: typography.fontSize.md, lineHeight: 22 },
});
