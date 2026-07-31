/**
 * useCategoriesQuery — loads categories from GET /categories (Supabase via API).
 * Pass `search` for server-side filter when a search UI is wired.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchCategories } from '@/services/category.service';

export function useCategoriesQuery(search?: string) {
  const trimmed = search?.trim() || undefined;

  return useQuery({
    queryKey: queryKeys.categories(trimmed),
    queryFn: () => fetchCategories({ search: trimmed }),
  });
}
