/**
 * Deep linking — notification tap + URL → in-app destination.
 *
 * Destinations:
 *   Course        → CourseDetail
 *   Live Class    → Live tab
 *   Test          → TestList
 *   Announcement  → Notification Center
 *   Banner        → same as banner redirect (course/test/live/website)
 *
 * Cold start:
 *   1) Tap while killed → OS launches app with notification response
 *   2) We queue payload until NavigationContainer is ready + user authenticated
 *   3) flushPendingDeepLinks() runs from RootNavigator onReady
 */
import * as Linking from 'expo-linking';

import { resolveBannerRedirect } from '@/modules/banners/resolveBannerRedirect';
import { navigationRef } from '@/navigation/navigationRef';
import { useAuthStore } from '@/store/authStore';
import type { Banner, BannerRedirectType } from '@sharanam/shared';

export type DeepLinkDestination =
  | { kind: 'course'; courseId: string }
  | { kind: 'live'; liveClassId?: string | null }
  | { kind: 'test'; testId?: string | null }
  | { kind: 'announcement'; announcementId?: string | null }
  | { kind: 'notifications' }
  | { kind: 'home' }
  | { kind: 'website'; url: string }
  | { kind: 'noop' };

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Parse sharanam://… or path-only deep links into a destination. */
export function parseDeepLinkUrl(raw: string): DeepLinkDestination {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'noop' };

  if (/^https?:\/\//i.test(trimmed)) {
    return { kind: 'website', url: trimmed };
  }

  let path = trimmed;
  try {
    if (trimmed.includes('://')) {
      const parsed = Linking.parse(trimmed);
      const host = parsed.hostname ?? '';
      const p = (parsed.path ?? '').replace(/^\//, '');
      // sharanam://course/uuid  → hostname=course, path=uuid
      // exp://…/--/course/uuid → path=course/uuid
      if (host && !['exp.host', 'u.expo.dev', 'localhost'].includes(host) && host !== 'sharanam') {
        path = p ? `${host}/${p}` : host;
      } else {
        path = p || host;
      }
      // query fallbacks
      const q = parsed.queryParams ?? {};
      const courseId = asString(q.courseId) || asString(q.course_id);
      if (courseId) return { kind: 'course', courseId };
    } else {
      path = trimmed.replace(/^\//, '');
    }
  } catch {
    path = trimmed.replace(/^(sharanam:\/\/|\/)/, '');
  }

  const parts = path.split('/').filter(Boolean);
  const head = (parts[0] ?? '').toLowerCase();
  const id = parts[1] ?? null;

  switch (head) {
    case 'course':
    case 'courses':
      return id ? { kind: 'course', courseId: id } : { kind: 'home' };
    case 'live':
    case 'live-class':
    case 'live_class':
      return { kind: 'live', liveClassId: id };
    case 'test':
    case 'tests':
      return { kind: 'test', testId: id };
    case 'announcement':
    case 'announcements':
      return { kind: 'announcement', announcementId: id };
    case 'notifications':
    case 'notification-center':
      return { kind: 'notifications' };
    case 'home':
    case '':
      return { kind: 'home' };
    default:
      return { kind: 'noop' };
  }
}

/**
 * Resolve push / inbox notification `data` payload → destination.
 * Supports typed fields and banner-shaped redirects.
 */
export function resolveNotificationDeepLink(
  data: Record<string, unknown> | undefined | null,
): DeepLinkDestination {
  if (!data) return { kind: 'noop' };

  const explicit =
    asString(data.deepLink) || asString(data.url) || asString(data.path);
  if (explicit) {
    return parseDeepLinkUrl(explicit);
  }

  const type = (
    asString(data.type) ||
    asString(data.notificationType) ||
    asString(data.notification_type) ||
    ''
  ).toLowerCase();

  const courseId =
    asString(data.courseId) ||
    asString(data.course_id) ||
    asString(data.redirect_target_id);
  const testId = asString(data.testId) || asString(data.test_id);
  const liveClassId =
    asString(data.liveClassId) || asString(data.live_class_id);
  const announcementId =
    asString(data.announcementId) || asString(data.announcement_id);

  switch (type) {
    case 'course':
    case 'course_update':
      return courseId ? { kind: 'course', courseId } : { kind: 'home' };

    case 'live':
    case 'live_class':
      return { kind: 'live', liveClassId };

    case 'test':
    case 'test_reminder':
      return {
        kind: 'test',
        testId: testId || (type === 'test' ? courseId : null),
      };

    case 'announcement':
      return { kind: 'announcement', announcementId };

    case 'banner': {
      const redirectType = (asString(data.redirect_type) ||
        asString(data.redirectType) ||
        'none') as BannerRedirectType;
      const banner = {
        id: 'notification-banner',
        title: '',
        subtitle: null,
        image: '',
        redirect_url: asString(data.redirect_url) || asString(data.redirectUrl),
        redirect_type: redirectType,
        redirect_target_id:
          asString(data.redirect_target_id) ||
          asString(data.redirectTargetId) ||
          asString(data.targetId),
        status: 'active',
        sort_order: 0,
      } satisfies Banner;
      const action = resolveBannerRedirect(banner);
      if (action.kind === 'course') return { kind: 'course', courseId: action.courseId };
      if (action.kind === 'test') return { kind: 'test', testId: action.testId };
      if (action.kind === 'live_class') {
        return { kind: 'live', liveClassId: action.liveClassId };
      }
      if (action.kind === 'website') return { kind: 'website', url: action.url };
      return { kind: 'noop' };
    }

    default:
      break;
  }

  // Untyped but has target ids
  if (courseId && !type) return { kind: 'course', courseId };
  if (announcementId) return { kind: 'announcement', announcementId };
  if (liveClassId) return { kind: 'live', liveClassId };
  if (testId) return { kind: 'test', testId };

  return { kind: 'noop' };
}

function navigateToDestination(dest: DeepLinkDestination): boolean {
  if (!navigationRef.isReady()) return false;
  if (dest.kind === 'noop') return true;

  switch (dest.kind) {
    case 'course':
      navigationRef.navigate('CourseDetail', { courseId: dest.courseId });
      return true;

    case 'live':
      navigationRef.navigate('MainTabs', {
        screen: 'Tabs',
        params: { screen: 'LiveTab' },
      });
      return true;

    case 'test':
      navigationRef.navigate('TestList');
      return true;

    case 'announcement':
    case 'notifications':
      navigationRef.navigate('NotificationCenter');
      return true;

    case 'home':
      navigationRef.navigate('MainTabs', {
        screen: 'Tabs',
        params: { screen: 'HomeTab' },
      });
      return true;

    case 'website':
      void Linking.openURL(dest.url).catch(() => undefined);
      return true;

    default:
      return true;
  }
}

let pendingDestination: DeepLinkDestination | null = null;

export function queueDeepLink(dest: DeepLinkDestination): void {
  if (dest.kind === 'noop') return;
  pendingDestination = dest;
  flushPendingDeepLinks();
}

export function openDeepLinkFromNotificationData(
  data: Record<string, unknown> | undefined | null,
): void {
  const dest = resolveNotificationDeepLink(data);
  if (dest.kind === 'noop') return;

  const authStatus = useAuthStore.getState().status;
  if (authStatus !== 'authenticated' || !navigationRef.isReady()) {
    queueDeepLink(dest);
    return;
  }

  const ok = navigateToDestination(dest);
  if (!ok) queueDeepLink(dest);
}

export function openDeepLinkUrl(url: string): void {
  const dest = parseDeepLinkUrl(url);
  if (dest.kind === 'noop') return;

  const authStatus = useAuthStore.getState().status;
  if (authStatus !== 'authenticated' || !navigationRef.isReady()) {
    queueDeepLink(dest);
    return;
  }

  const ok = navigateToDestination(dest);
  if (!ok) queueDeepLink(dest);
}

/** Call when NavigationContainer is ready and/or auth becomes authenticated. */
export function flushPendingDeepLinks(): void {
  if (!pendingDestination) return;
  if (useAuthStore.getState().status !== 'authenticated') return;
  if (!navigationRef.isReady()) return;

  const dest = pendingDestination;
  pendingDestination = null;
  navigateToDestination(dest);
}
