/**
 * ProfileCard — modern hero: avatar ring, name, class/medium chips.
 */
import { StyleSheet, Text, View } from 'react-native';

import type { StudentProfile } from '@sharanam/shared';
import { ProfilePhoto } from '@/modules/profile/components/ProfilePhoto';
import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';

type Props = {
  profile: StudentProfile;
};

function formatClass(classLevel: string): string {
  if (!classLevel) return '—';
  if (/^\d+$/.test(classLevel)) return `Class ${classLevel}`;
  return classLevel.charAt(0).toUpperCase() + classLevel.slice(1);
}

function formatMedium(medium: string): string {
  if (!medium) return '—';
  const label = medium.charAt(0).toUpperCase() + medium.slice(1);
  return `${label} Medium`;
}

export function ProfileCard({ profile }: Props) {
  const theme = useAppTheme();
  const name = profile.full_name?.trim() || 'Student';
  const isDark = theme.canvas === '#0B1F3A';

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={styles.glow} pointerEvents="none">
        <View style={[styles.glowOrb, { backgroundColor: colors.accent }]} />
      </View>

      <View style={styles.avatarRing}>
        <View style={styles.ringOuter}>
          <View style={[styles.avatarInner, { backgroundColor: theme.canvas }]}>
            <ProfilePhoto name={name} avatarUrl={profile.avatar_url} size={88} />
          </View>
        </View>
      </View>

      <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={2}>
        {name}
      </Text>

      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: 'rgba(201,162,39,0.18)' }]}>
          <Text style={[styles.chipText, { color: colors.accent }]}>
            {formatClass(profile.class_level)}
          </Text>
        </View>
        <View
          style={[
            styles.chip,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(11,31,58,0.06)',
            },
          ]}
        >
          <Text style={[styles.chipText, { color: theme.textSecondary }]}>
            {formatMedium(profile.medium)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  glowOrb: {
    position: 'absolute',
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.12,
  },
  avatarRing: {
    marginBottom: spacing.xs,
  },
  ringOuter: {
    padding: 3,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: colors.accent,
    backgroundColor: 'rgba(201,162,39,0.22)',
  },
  avatarInner: {
    padding: 3,
    borderRadius: 49,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    paddingHorizontal: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
