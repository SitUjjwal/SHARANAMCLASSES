/**
 * NotificationPreferencesScreen — per-channel push toggles (stored locally).
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { SettingToggle } from '@/modules/settings/components/SettingToggle';
import { useSettingsStore } from '@/modules/settings/store/settingsStore';
import type { AppStackParamList } from '@/types/navigation';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'NotificationPreferences'>;

export function NotificationPreferencesScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const notifications = useSettingsStore((s) => s.notifications);
  const setPref = useSettingsStore((s) => s.setNotificationPref);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Notification Preferences
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Control which alerts you want. Device permission is still required for push.
        </Text>

        <View style={styles.list}>
          <SettingToggle
            label="Push notifications"
            subtitle="Master switch for remote alerts"
            value={notifications.pushEnabled}
            onValueChange={(v) => setPref('pushEnabled', v)}
          />
          <SettingToggle
            label="Courses"
            subtitle="New chapters and course updates"
            value={notifications.courses}
            onValueChange={(v) => setPref('courses', v)}
          />
          <SettingToggle
            label="Tests"
            subtitle="Quizzes, reminders, and results"
            value={notifications.tests}
            onValueChange={(v) => setPref('tests', v)}
          />
          <SettingToggle
            label="Live classes"
            subtitle="Upcoming and live session alerts"
            value={notifications.liveClasses}
            onValueChange={(v) => setPref('liveClasses', v)}
          />
          <SettingToggle
            label="Payments"
            subtitle="Purchase and receipt notices"
            value={notifications.payments}
            onValueChange={(v) => setPref('payments', v)}
          />
          <SettingToggle
            label="Announcements"
            subtitle="School / app announcements"
            value={notifications.announcements}
            onValueChange={(v) => setPref('announcements', v)}
          />
        </View>

        <AppButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
    marginTop: -spacing.xs,
  },
  list: { gap: spacing.sm },
});
