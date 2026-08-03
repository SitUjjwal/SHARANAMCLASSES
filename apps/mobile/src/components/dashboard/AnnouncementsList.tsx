/**
 * AnnouncementsList — Home feed (pinned, image, rich-text excerpt).
 */
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { Announcement } from '@sharanam/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing, typography } from '@/theme';

type AnnouncementsListProps = {
  announcements: Announcement[];
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  if (!announcements.length) {
    return (
      <EmptyState
        icon="megaphone-outline"
        title="No announcements"
        message="Class notices and announcements will show up here."
      />
    );
  }

  return (
    <View style={styles.list}>
      {announcements.map((item) => {
        const excerpt = stripHtml(item.body);
        return (
          <View key={item.id} style={[styles.row, item.is_pinned ? styles.pinned : null]}>
            {item.is_pinned ? <Text style={styles.pinBadge}>Pinned</Text> : null}
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : null}
            <Text style={styles.title}>📢 {item.title}</Text>
            {excerpt ? (
              <Text style={styles.body} numberOfLines={3}>
                {excerpt}
              </Text>
            ) : null}
            <Text style={styles.date}>
              {new Date(item.scheduled_at || item.published_at).toLocaleDateString()}
            </Text>
          </View>
        );
      })}
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
    overflow: 'hidden',
  },
  pinned: {
    borderColor: 'rgba(201,162,39,0.55)',
    backgroundColor: 'rgba(201,162,39,0.08)',
  },
  pinBadge: {
    alignSelf: 'flex-start',
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
