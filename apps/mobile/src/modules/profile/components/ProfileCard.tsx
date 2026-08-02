/**
 * ProfileCard — photo, name, class, medium (Student Profile header).
 */
import { StyleSheet, Text, View } from 'react-native';

import type { StudentProfile } from '@sharanam/shared';
import { ProfilePhoto } from '@/modules/profile/components/ProfilePhoto';
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
  const name = profile.full_name?.trim() || 'Student';

  return (
    <View style={styles.card}>
      <ProfilePhoto name={name} avatarUrl={profile.avatar_url} size={96} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.meta}>{formatClass(profile.class_level)}</Text>
      <Text style={styles.meta}>{formatMedium(profile.medium)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  name: {
    marginTop: spacing.md,
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  meta: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.lg,
    fontWeight: '500',
    textAlign: 'center',
  },
});
