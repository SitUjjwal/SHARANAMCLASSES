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
  /** Unread badge count (chat / notifications style) */
  badgeCount?: number;
};

export function SettingItem({
  label,
  subtitle,
  onPress,
  danger,
  showChevron = true,
  badgeCount = 0,
}: Props) {
  const theme = useAppTheme();
  const badgeLabel = badgeCount > 99 ? '99+' : String(badgeCount);

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
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.label,
              { color: danger ? theme.danger : theme.textPrimary, flexShrink: 1 },
            ]}
          >
            {label}
          </Text>
          {badgeCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.danger }]}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </View>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
