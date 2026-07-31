/**
 * UpdatesList — latest announcements from API.
 * Why: operational news (timetable, exams) separate from course catalog.
 */
import { StyleSheet, Text, View } from 'react-native';

import type { AppUpdate } from '@sharanam/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing, typography } from '@/theme';

type UpdatesListProps = {
  updates: AppUpdate[];
};

export function UpdatesList({ updates }: UpdatesListProps) {
  if (!updates.length) {
    return (
      <EmptyState
        icon="notifications-outline"
        title="No updates"
        message="Class notices and announcements will show up here."
      />
    );
  }

  return (
    <View style={styles.list}>
      {updates.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body} numberOfLines={3}>
            {item.body}
          </Text>
          <Text style={styles.date}>
            {new Date(item.published_at).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  body: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
  date: {
    color: '#7A8799',
    fontSize: typography.fontSize.sm,
  },
});
