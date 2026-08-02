/**
 * SettingItem — tappable settings row (theme-aware).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = {
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  /** Hide chevron (e.g. version row) */
  showChevron?: boolean;
};

export function SettingItem({
  label,
  subtitle,
  onPress,
  danger,
  showChevron = true,
}: Props) {
  const theme = useAppTheme();

  return (
    <Pressable
      style={[
        styles.row,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <View style={styles.textCol}>
        <Text
          style={[
            styles.label,
            { color: danger ? theme.danger : theme.textPrimary },
          ]}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron && onPress ? (
        <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
});
