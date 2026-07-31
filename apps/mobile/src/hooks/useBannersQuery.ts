/**
 * useBannersQuery — standalone banner fetch (optional; Home can also use dashboard.banners).
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchBanners } from '@/services/banner.service';

export function useBannersQuery() {
  return useQuery({
    queryKey: queryKeys.banners,
    queryFn: fetchBanners,
  });
}
