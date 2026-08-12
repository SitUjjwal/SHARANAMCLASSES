/**
 * AboutScreen — app blurb + version.
 */
import { StyleSheet, Text, View, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { ABOUT_EN, ABOUT_HI } from '@/modules/settings/constants/legalContent';
import { useSettingsStore } from '@/modules/settings/store/settingsStore';
import type { AppStackParamList } from '@/types/navigation';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'About'>;

export function AboutScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const language = useSettingsStore((s) => s.language);
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build =
    Platform.OS === 'android'
      ? String(Constants.expoConfig?.android?.versionCode ?? '—')
      : String(Constants.expoConfig?.ios?.buildNumber ?? '—');

  return (
    <Screen>
      <Text style={[styles.brand, { color: theme.accent }]}>SHARANAM CLASSES</Text>
      <Text style={[styles.title, { color: theme.textPrimary }]}>About</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        {language === 'hi' ? ABOUT_HI : ABOUT_EN}
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        <Text style={[styles.label, { color: theme.textSecondary }]}>App Version</Text>
        <Text style={[styles.value, { color: theme.textPrimary }]}>{version}</Text>
        <Text style={[styles.label, { color: theme.textSecondary, marginTop: 8 }]}>
          Build number
        </Text>
        <Text style={[styles.value, { color: theme.textPrimary }]}>{build}</Text>
      </View>

      <AppButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  body: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  value: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
});
