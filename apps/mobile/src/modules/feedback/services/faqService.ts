/**
 * faqService — student FAQ list + search.
 */
import type { ApiSuccessResponse, Faq } from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function fetchFaqs(search = ''): Promise<Faq[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Faq[]>>('/faqs', {
    params: search.trim() ? { q: search.trim() } : undefined,
  });
  return data.data;
}
