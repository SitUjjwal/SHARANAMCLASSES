/**
 * Live checklist for strong password rules.
 */
import { StyleSheet, Text, View } from 'react-native';

import {
  getPasswordStrengthChecks,
  type PasswordStrengthChecks,
} from '@/auth/schemas';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

const RULES: { key: keyof PasswordStrengthChecks; label: string }[] = [
  { key: 'minLength', label: 'At least 8 characters' },
  { key: 'upper', label: 'One uppercase letter' },
  { key: 'lower', label: 'One lowercase letter' },
  { key: 'number', label: 'One number' },
  { key: 'special', label: 'One special character (!@#$…)' },
];

type Props = {
  password: string;
};

export function PasswordStrengthHints({ password }: Props) {
  const theme = useAppTheme();
  const checks = getPasswordStrengthChecks(password);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={[styles.title, { color: theme.textSecondary }]}>
        Password must include
      </Text>
      {RULES.map((rule) => {
        const ok = checks[rule.key];
        return (
          <Text
            key={rule.key}
            style={[
              styles.rule,
              { color: ok ? '#2ECC71' : theme.textSecondary },
            ]}
          >
            {ok ? '✓' : '○'} {rule.label}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    marginTop: -spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  rule: {
    fontSize: typography.fontSize.sm,
  },
});
