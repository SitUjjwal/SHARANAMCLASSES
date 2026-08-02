/**
 * LanguageSettingsScreen — app UI language preference (en / hi).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import {
  useSettingsStore,
  type AppLanguage,
} from '@/modules/settings/store/settingsStore';
import type { AppStackParamList } from '@/types/navigation';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'LanguageSettings'>;

const OPTIONS: { value: AppLanguage; label: string; subtitle: string }[] = [
  { value: 'en', label: 'English', subtitle: 'Default' },
  { value: 'hi', label: 'हिन्दी', subtitle: 'Hindi' },
];

export function LanguageSettingsScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Language</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Used for legal pages and future in-app copy. Course medium is still set on your profile.
      </Text>

      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const selected = language === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setLanguage(opt.value)}
              style={[
                styles.option,
                {
                  backgroundColor: theme.card,
                  borderColor: selected ? theme.accent : theme.cardBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>
                {opt.label}
              </Text>
              <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                {opt.subtitle}
                {selected ? ' · Selected' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AppButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  list: { gap: spacing.sm, marginBottom: spacing.lg },
  option: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  optionLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  optionSub: {
    fontSize: typography.fontSize.sm,
  },
});
