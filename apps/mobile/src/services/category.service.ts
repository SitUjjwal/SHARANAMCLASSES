/**
 * Categories API — load active subjects from backend (Supabase-backed).
 */
import { apiClient } from '@/api/client';
import type { ApiSuccessResponse, Category } from '@sharanam/shared';

export type FetchCategoriesParams = {
  /** Future / current server-side search */
  search?: string;
};

export async function fetchCategories(
  params?: FetchCategoriesParams,
): Promise<Category[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Category[]>>('/categories', {
    params: {
      search: params?.search?.trim() || undefined,
    },
  });
  return data.data;
}
