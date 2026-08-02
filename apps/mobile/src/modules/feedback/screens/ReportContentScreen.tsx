/**
 * ReportContentScreen — report incorrect video/PDF, broken link, bad question, duplicate.
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { submitContentReport } from '@/modules/feedback/services/contentReportService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { ContentReportType } from '@sharanam/shared';
import { CONTENT_REPORT_TYPE_LABELS } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'ReportContent'>;

const REPORT_TYPES = Object.keys(CONTENT_REPORT_TYPE_LABELS) as ContentReportType[];

export function ReportContentScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const preset = route.params ?? {};

  const [reportType, setReportType] = useState<ContentReportType | null>(
    preset.report_type ?? null,
  );
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const contextHint = useMemo(() => {
    if (!preset.target_label && !preset.target_type) return null;
    const parts = [
      preset.target_label,
      preset.target_type ? `(${preset.target_type})` : null,
    ].filter(Boolean);
    return parts.join(' ');
  }, [preset.target_label, preset.target_type]);

  async function onSubmit() {
    setError(null);
    if (!reportType) {
      setError('Select a report type.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Describe the issue in at least 10 characters.');
      return;
    }

    setSaving(true);
    try {
      const report = await submitContentReport({
        report_type: reportType,
        description: description.trim(),
        target_type: preset.target_type ?? null,
        target_id: preset.target_id ?? null,
        course_id: preset.course_id ?? null,
        chapter_id: preset.chapter_id ?? null,
        target_label: preset.target_label ?? null,
      });
      setTicketNumber(report.ticket_number);
      setCreatedId(report.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit content report'));
    } finally {
      setSaving(false);
    }
  }

  if (createdId && ticketNumber) {
    return (
      <Screen>
        <View style={styles.scroll}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Report sent</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Ticket {ticketNumber}. We will update the status as we investigate.
          </Text>
          <AppButton
            label="Track status"
            onPress={() =>
              navigation.replace('ContentReportDetail', { reportId: createdId })
            }
          />
          <AppButton
            label="My content reports"
            variant="ghost"
            onPress={() => navigation.navigate('MyContentReports')}
          />
          <AppButton label="Done" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <LoadingOverlay visible={saving} message="Submitting…" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.textPrimary }]}>Report content</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Flag incorrect videos, wrong PDFs, broken links, bad questions, or duplicates.
        </Text>

        {contextHint ? (
          <View
            style={[
              styles.context,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.contextLabel, { color: theme.textSecondary }]}>
              Reporting
            </Text>
            <Text style={[styles.contextValue, { color: theme.textPrimary }]}>
              {contextHint}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.label, { color: theme.textSecondary }]}>Type</Text>
        <View style={styles.chips}>
          {REPORT_TYPES.map((type) => {
            const selected = reportType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setReportType(type)}
                style={[
                  styles.chip,
                  {
                    borderColor: selected ? theme.accent : theme.cardBorder,
                    backgroundColor: selected ? theme.accent : theme.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selected ? '#0B1F3A' : theme.textPrimary },
                  ]}
                >
                  {CONTENT_REPORT_TYPE_LABELS[type]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppTextField
          label="Describe the issue"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          placeholder="What is wrong? What should it be instead?"
        />

        <ErrorMessage message={error} />
        <AppButton label="Submit report" onPress={() => void onSubmit()} loading={saving} />
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  context: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  contextLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contextValue: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});
