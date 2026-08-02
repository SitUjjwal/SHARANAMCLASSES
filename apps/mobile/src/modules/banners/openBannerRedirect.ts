/**
 * Resolve banner tap → in-app navigation or external website.
 * Shares destinations with notification deep linking.
 */
import * as Linking from 'expo-linking';

import type { Banner } from '@sharanam/shared';
import { resolveBannerRedirect } from '@/modules/banners/resolveBannerRedirect';
import { openDeepLinkFromNotificationData } from '@/navigation/deepLinking';

export async function openBannerRedirect(banner: Banner): Promise<void> {
  const action = resolveBannerRedirect(banner);

  if (action.kind === 'website') {
    try {
      const canOpen = await Linking.canOpenURL(action.url);
      if (canOpen) await Linking.openURL(action.url);
    } catch {
      // ignore
    }
    return;
  }

  if (action.kind === 'noop') return;

  openDeepLinkFromNotificationData({
    type: 'banner',
    redirect_type: banner.redirect_type,
    redirect_target_id: banner.redirect_target_id,
    redirect_url: banner.redirect_url,
  });
}
