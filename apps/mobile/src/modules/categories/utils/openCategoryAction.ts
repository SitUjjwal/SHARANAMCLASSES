/**
 * Category tap action — open social/external link when set, else browse courses.
 */
import type { Category } from '@sharanam/shared';

import { openExternalUrl } from '@/utils/openExternal';

export function categoryHasExternalLink(category: Category): boolean {
  return Boolean(category.link_url?.trim());
}

/**
 * @returns true if an external link was opened (caller should not navigate).
 */
export async function openCategoryExternalLink(category: Category): Promise<boolean> {
  const url = category.link_url?.trim();
  if (!url) return false;

  return openExternalUrl(url, {
    failureMessage: 'Could not open this link.',
  });
}
