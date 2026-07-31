/**
 * Client-side category filter — used when search UI is added without refetch,
 * or to refine an already-fetched list.
 */
import type { Category } from '@sharanam/shared';

export function filterCategories(
  categories: readonly Category[],
  search?: string,
): Category[] {
  const q = search?.trim().toLowerCase();
  if (!q) {
    return [...categories];
  }

  return categories.filter(
    (category) =>
      category.name.toLowerCase().includes(q) ||
      category.slug.toLowerCase().includes(q),
  );
}
