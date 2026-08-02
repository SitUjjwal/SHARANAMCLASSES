/**
 * CertificateCard — number, issue date, status.
 */
import { Pressable, StyleSheet, Text } from 'react-native';

import type { Certificate } from '@sharanam/shared';
import { colors, spacing, typography } from '@/theme';

type Props = {
  certificate: Certificate;
  onPress?: () => void;
};

export function CertificateCard({ certificate, onPress }: Props) {
  const issued = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString('en-IN', {
        dateStyle: 'medium',
      })
    : null;

  const statusLabel =
    certificate.status === 'issued'
      ? 'Issued'
      : certificate.status === 'pending_approval'
        ? 'Awaiting approval'
        : 'Rejected';

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <Text style={styles.badge}>{statusLabel}</Text>
      <Text style={styles.title}>{certificate.title}</Text>
      {certificate.course_title ? (
        <Text style={styles.meta}>{certificate.course_title}</Text>
      ) : null}
      {certificate.certificate_number ? (
        <Text style={styles.number}>No. {certificate.certificate_number}</Text>
      ) : null}
      {issued ? <Text style={styles.meta}>Issue date {issued}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(201,162,39,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.35)',
  },
  badge: {
    alignSelf: 'flex-start',
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  number: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  meta: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
});
