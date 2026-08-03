/**
 * usePurchaseHistoryQuery — first-page cache (compat for non-infinite callers).
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchPurchaseHistory } from '@/services/payment.service';

export function usePurchaseHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.purchaseHistory({ page: 1, pageSize: 50 }),
    queryFn: () => fetchPurchaseHistory({ page: 1, pageSize: 50 }),
    staleTime: 60_000,
  });
}
