/**
 * LegalDocumentScreen — Privacy Policy / Terms (language-aware).
 */
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { getLegalDocument } from '@/modules/settings/constants/legalContent';
import { useSettingsStore } from '@/modules/settings/store/settingsStore';
import type { AppStackParamList } from '@/types/navigation';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'LegalDocument'>;

export function LegalDocumentScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const language = useSettingsStore((s) => s.language);
  const doc = getLegalDocument(route.params.doc, language);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{doc.title}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{doc.body}</Text>
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
  body: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
});
