/**
 * FeatureRequestScreen — suggest a new feature.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { submitFeatureRequest } from '@/modules/feedback/services/feedbackService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'FeatureRequest'>;

export function FeatureRequestScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!title.trim() || !description.trim()) {
      setError('Please add a title and description.');
      return;
    }
    setSaving(true);
    try {
      await submitFeatureRequest({
        title: title.trim(),
        description: description.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit request'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <LoadingOverlay visible={saving} message="Submitting…" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.textPrimary }]}>Feature request</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Tell us what would make learning better.
        </Text>
        <View style={styles.form}>
          <AppTextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Short idea title"
          />
          <AppTextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            placeholder="Why this would help you"
          />
          <ErrorMessage message={error} />
          {done ? (
            <Text style={[styles.success, { color: theme.success }]}>
              Thanks — we will review your idea.
            </Text>
          ) : null}
          <AppButton
            label={done ? 'Done' : 'Submit request'}
            onPress={() => {
              if (done) navigation.goBack();
              else void onSubmit();
            }}
            loading={saving}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: typography.fontSize.xxl, fontWeight: '700' },
  subtitle: { fontSize: typography.fontSize.md },
  form: { gap: spacing.md },
  success: { fontSize: typography.fontSize.md, fontWeight: '600' },
});
