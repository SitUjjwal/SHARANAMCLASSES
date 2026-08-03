/**
 * Admin category API — Home grid tiles.
 */
import type { Category } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type CategoryWritePayload = {
  name: string;
  slug: string;
  icon?: string | null;
  link_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export function fetchAdminCategories() {
  return apiRequest<Category[]>('/categories');
}

export function createAdminCategory(payload: CategoryWritePayload) {
  return apiRequest<Category>('/categories', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminCategory(id: string, payload: Partial<CategoryWritePayload>) {
  return apiRequest<Category>(`/categories/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteAdminCategory(id: string) {
  return apiRequest<null>(`/categories/${id}`, {
    method: 'DELETE',
  });
}

export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}
