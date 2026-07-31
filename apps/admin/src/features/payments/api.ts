/**
 * Admin Payment Management API.
 *
 * GET /admin/payments/stats
 * GET /admin/payments
 * GET /admin/payments/export
 */
import type {
  PaymentAdminCsvExport,
  PaymentAdminListPage,
  PaymentAdminStats,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type PaymentFilters = {
  search?: string;
  status?: 'all' | 'created' | 'paid' | 'failed' | 'expired';
  page?: number;
  pageSize?: number;
};

export function fetchAdminPaymentStats() {
  return apiRequest<PaymentAdminStats>('/admin/payments/stats');
}

export function fetchAdminPayments(filters: PaymentFilters = {}) {
  return apiRequest<PaymentAdminListPage>('/admin/payments', {
    params: {
      search: filters.search,
      status: filters.status ?? 'all',
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
}

export function exportAdminPaymentsCsv(filters: Omit<PaymentFilters, 'page' | 'pageSize'> = {}) {
  return apiRequest<PaymentAdminCsvExport>('/admin/payments/export', {
    params: {
      search: filters.search,
      status: filters.status ?? 'all',
    },
  });
}

export function downloadCsvFile(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
