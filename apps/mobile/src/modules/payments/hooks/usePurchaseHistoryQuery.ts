/**
 * usePurchaseHistoryQuery — React Query cache for Purchase History.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchPurchaseHistory } from '@/services/payment.service';

export function usePurchaseHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.purchaseHistory,
    queryFn: fetchPurchaseHistory,
    staleTime: 60_000,
  });
}
