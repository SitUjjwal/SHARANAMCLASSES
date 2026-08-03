import { QueryClient } from '@tanstack/react-query';

/**
 * React Query defaults tuned for mobile:
 * - staleTime: avoid refetch storms while scrolling
 * - gcTime: keep unused pages in memory for back-navigation
 * - retry / refetchOnWindowFocus: reduce cellular waste
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Longer cache for rarely changing catalogs */
export const CATALOG_STALE_MS = 1000 * 60 * 5;
export const CATALOG_GC_MS = 1000 * 60 * 60;
