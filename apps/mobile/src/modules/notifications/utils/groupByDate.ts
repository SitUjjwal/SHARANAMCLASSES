/**
 * Group inbox items: Today → Yesterday → Last Week → Earlier.
 * Matches student Notification Center UX.
 */
import type { NotificationInboxItem } from '@sharanam/shared';

export type NotificationDateSection = {
  title: 'Today' | 'Yesterday' | 'Last Week' | 'Earlier' | string;
  data: NotificationInboxItem[];
};

const SECTION_ORDER = ['Today', 'Yesterday', 'Last Week', 'Earlier'] as const;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function formatDayLabel(date: Date, now = new Date()): string {
  const day = startOfDay(date);
  const today = startOfDay(now);
  const yesterday = today - 24 * 60 * 60 * 1000;
  const weekAgo = today - 7 * 24 * 60 * 60 * 1000;

  if (day === today) return 'Today';
  if (day === yesterday) return 'Yesterday';
  if (day < yesterday && day >= weekAgo) return 'Last Week';
  return 'Earlier';
}

export function groupNotificationsByDate(
  items: NotificationInboxItem[],
  now = new Date(),
): NotificationDateSection[] {
  const map = new Map<string, NotificationInboxItem[]>();

  for (const item of items) {
    const label = formatDayLabel(new Date(item.created_at), now);
    const list = map.get(label) ?? [];
    list.push(item);
    map.set(label, list);
  }

  return SECTION_ORDER.filter((title) => (map.get(title)?.length ?? 0) > 0).map(
    (title) => ({
      title,
      data: map.get(title) ?? [],
    }),
  );
}

export function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Subject / course line under the title (Physics, Mathematics, …). */
export function notificationSubtitle(item: NotificationInboxItem): string {
  return (
    item.data.subject?.trim() ||
    item.data.courseName?.trim() ||
    item.data.chapterName?.trim() ||
    ''
  );
}

export function notificationTypeEmoji(type: string): string {
  switch (type) {
    case 'live_class':
      return '🔴';
    case 'course_update':
      return '📘';
    case 'test_reminder':
      return '📝';
    case 'announcement':
      return '🎉';
    default:
      return '🔔';
  }
}
