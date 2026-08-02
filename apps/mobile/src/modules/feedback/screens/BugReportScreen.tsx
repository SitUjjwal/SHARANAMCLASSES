/**
 * BugReportScreen — describe issue, select screen, optional screenshot.
 */
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { submitBugReport } from '@/modules/feedback/services/bugReportService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { BugReportScreenKey } from '@sharanam/shared';
import { BUG_REPORT_SCREENS } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'BugReport'>;

export function BugReportScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [description, setDescription] = useState('');
  const [screenKey, setScreenKey] = useState<BugReportScreenKey | null>(null);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [screenshotMime, setScreenshotMime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function pickScreenshot() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required to attach a screenshot.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mime =
      asset.mimeType && asset.mimeType.startsWith('image/')
        ? asset.mimeType
        : 'image/jpeg';

    if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') {
      setError('Use JPEG, PNG, or WebP for screenshots.');
      return;
    }

    setError(null);
    setScreenshotUri(asset.uri);
    setScreenshotMime(mime);
  }

  async function onSubmit() {
    setError(null);
    if (!screenKey) {
      setError('Select which screen has the issue.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Describe the issue in at least 10 characters.');
      return;
    }

    setSaving(true);
    try {
      const report = await submitBugReport({
        description: description.trim(),
        screen_key: screenKey,
        screenshotUri,
        screenshotMimeType: screenshotMime,
      });
      setTicketNumber(report.ticket_number);
      setCreatedId(report.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit bug report'));
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
              navigation.replace('BugReportDetail', { reportId: createdId })
            }
          />
          <AppButton
            label="My bug reports"
            variant="ghost"
            onPress={() => navigation.navigate('MyBugReports')}
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Report a bug</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Describe the issue, pick the screen, and optionally attach a screenshot.
        </Text>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Screen</Text>
        <View style={styles.chips}>
          {BUG_REPORT_SCREENS.map((screen) => {
            const selected = screenKey === screen.key;
            return (
              <Pressable
                key={screen.key}
                onPress={() => setScreenKey(screen.key)}
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
                  {screen.label}
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
          placeholder="What happened? What did you expect? Steps to reproduce"
        />

        <Text style={[styles.label, { color: theme.textSecondary }]}>Screenshot</Text>
        {screenshotUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: screenshotUri }} style={styles.preview} />
            <AppButton
              label="Remove screenshot"
              variant="ghost"
              onPress={() => {
                setScreenshotUri(null);
                setScreenshotMime(null);
              }}
            />
          </View>
        ) : (
          <AppButton label="Upload screenshot" variant="ghost" onPress={() => void pickScreenshot()} />
        )}

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
  previewWrap: { gap: spacing.sm },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    resizeMode: 'cover',
  },
});
