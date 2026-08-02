/**
 * Admin FAQ API client.
 */
import type { CreateFaqInput, Faq, UpdateFaqInput } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export function fetchAdminFaqs() {
  return apiRequest<Faq[]>('/admin/faqs');
}

export function createAdminFaq(payload: CreateFaqInput) {
  return apiRequest<Faq>('/admin/faqs', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminFaq(faqId: string, payload: UpdateFaqInput) {
  return apiRequest<Faq>(`/admin/faqs/${faqId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteAdminFaq(faqId: string) {
  return apiRequest<null>(`/admin/faqs/${faqId}`, {
    method: 'DELETE',
  });
}

export function reorderAdminFaqs(ordered_ids: string[]) {
  return apiRequest<Faq[]>('/admin/faqs/reorder', {
    method: 'PUT',
    body: { ordered_ids },
  });
}
