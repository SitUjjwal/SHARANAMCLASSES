/**
 * Public platform settings (social links, branding) for drawer / contact.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchPublicPlatform } from '@/modules/platform/services/platformService';

export function usePublicPlatformQuery() {
  return useQuery({
    queryKey: queryKeys.publicPlatform,
    queryFn: fetchPublicPlatform,
    staleTime: 5 * 60_000,
  });
}
