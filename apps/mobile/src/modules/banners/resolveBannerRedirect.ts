/**
 * Pure banner redirect resolution (testable without React Navigation / Linking).
 *
 * Banner click →
 *   course     → Open CourseDetail
 *   test       → Open TestList (optionally deep-link later)
 *   live_class → Open Live tab
 *   website    → Open external URL
 *   none       → no-op (unless legacy redirect_url)
 */
import type { Banner, BannerRedirectType } from '@sharanam/shared';

export type BannerRedirectAction =
  | { kind: 'noop' }
  | { kind: 'course'; courseId: string }
  | { kind: 'test'; testId: string | null }
  | { kind: 'live_class'; liveClassId: string | null }
  | { kind: 'website'; url: string };

export function resolveBannerRedirect(banner: Banner): BannerRedirectAction {
  const type: BannerRedirectType = banner.redirect_type ?? 'none';
  const targetId = banner.redirect_target_id;

  if (type === 'course') {
    if (!targetId) return { kind: 'noop' };
    return { kind: 'course', courseId: targetId };
  }

  if (type === 'test') {
    return { kind: 'test', testId: targetId };
  }

  if (type === 'live_class') {
    return { kind: 'live_class', liveClassId: targetId };
  }

  if (type === 'website') {
    if (!banner.redirect_url) return { kind: 'noop' };
    return { kind: 'website', url: banner.redirect_url };
  }

  // Legacy / none with URL still opens website
  if (banner.redirect_url) {
    return { kind: 'website', url: banner.redirect_url };
  }

  return { kind: 'noop' };
}
