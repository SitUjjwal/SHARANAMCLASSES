/**
 * usePurchaseHistoryInfiniteQuery — paginated purchase history.
 */
import { useInfiniteQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchPurchaseHistory } from '@/services/payment.service';

export function usePurchaseHistoryInfiniteQuery(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: queryKeys.purchaseHistory({ pageSize }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchPurchaseHistory({ page: pageParam, pageSize }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 60_000,
  });
}
