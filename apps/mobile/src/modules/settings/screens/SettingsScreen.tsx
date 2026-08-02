/**
 * SettingsScreen — Dark Mode, notifications, language, legal, about, version, logout.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { useLogoutMutation } from '@/hooks/useAuthMutations';
import { SettingItem } from '@/modules/profile/components/SettingItem';
import { SettingToggle } from '@/modules/settings/components/SettingToggle';
import { useSettingsStore } from '@/modules/settings/store/settingsStore';
import type { AppStackParamList } from '@/types/navigation';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

function appVersionLabel(): string {
  const version =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    '1.0.0';
  const build =
    Constants.expoConfig?.android?.versionCode ??
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.nativeBuildVersion;
  return build ? `${version} (${build})` : version;
}

export function SettingsScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const darkMode = useSettingsStore((s) => s.darkMode);
  const language = useSettingsStore((s) => s.language);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);
  const logoutMutation = useLogoutMutation();

  const languageLabel = language === 'hi' ? 'हिन्दी' : 'English';

  return (
    <Screen>
      <LoadingOverlay
        visible={logoutMutation.isPending}
        message="Signing you out…"
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Appearance</Text>
        <SettingToggle
          label="Dark Mode"
          subtitle={darkMode ? 'On — navy classroom look' : 'Off — light canvas'}
          value={darkMode}
          onValueChange={setDarkMode}
        />

        <Text style={[styles.section, { color: theme.textSecondary }]}>Preferences</Text>
        <View style={styles.list}>
          <SettingItem
            label="Notification Preferences"
            subtitle="Push, courses, tests, live, payments"
            onPress={() => navigation.navigate('NotificationPreferences')}
          />
          <SettingItem
            label="Language"
            subtitle={languageLabel}
            onPress={() => navigation.navigate('LanguageSettings')}
          />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Account</Text>
        <View style={styles.list}>
          <SettingItem
            label="Edit profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingItem
            label="Change password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingItem
            label="Test history"
            onPress={() => navigation.navigate('TestHistory')}
          />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Help</Text>
        <View style={styles.list}>
          <SettingItem
            label="Feedback & Support"
            subtitle="Reviews, FAQ, contact, bug reports"
            onPress={() => navigation.navigate('Feedback')}
          />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Legal & info</Text>
        <View style={styles.list}>
          <SettingItem
            label="Privacy Policy"
            onPress={() =>
              navigation.navigate('LegalDocument', { doc: 'privacy' })
            }
          />
          <SettingItem
            label="Terms"
            onPress={() => navigation.navigate('LegalDocument', { doc: 'terms' })}
          />
          <SettingItem
            label="About"
            onPress={() => navigation.navigate('About')}
          />
          <SettingItem
            label="App Version"
            subtitle={appVersionLabel()}
            showChevron={false}
          />
        </View>

        <View style={styles.list}>
          <SettingItem
            label="Logout"
            danger
            onPress={() => logoutMutation.mutate()}
          />
        </View>

        <ErrorMessage message={logoutMutation.error?.message} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: spacing.sm,
  },
});
