/**
 * SettingToggle — label + Switch for preferences (Dark Mode, notifications).
 */
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};

export function SettingToggle({ label, subtitle, value, onValueChange }: Props) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
    >
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: theme.switchTrackOff,
          true: theme.switchTrackOn,
        }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
      />
    </View>
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
});
