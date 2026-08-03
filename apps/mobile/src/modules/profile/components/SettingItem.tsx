/**
 * SettingItem — modern tappable row with optional leading icon.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';

type Props = {
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  badgeCount?: number;
  /** Ionicons glyph name */
  icon?: keyof typeof Ionicons.glyphMap;
};

export function SettingItem({
  label,
  subtitle,
  onPress,
  danger,
  showChevron = true,
  badgeCount = 0,
  icon,
}: Props) {
  const theme = useAppTheme();
  const badgeLabel = badgeCount > 99 ? '99+' : String(badgeCount);
  const iconColor = danger ? theme.danger : colors.accent;
  const isDark = theme.canvas === '#0B1F3A';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: danger
                ? 'rgba(242,139,130,0.16)'
                : isDark
                  ? 'rgba(201,162,39,0.16)'
                  : 'rgba(201,162,39,0.12)',
            },
          ]}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      ) : null}

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
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
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
