/**
 * Shared pagination helpers for list APIs.
 */
export type PageParams = {
  page: number;
  pageSize: number;
};

export type PageMeta = PageParams & {
  total: number;
  hasMore: boolean;
};

export function normalizePageParams(
  input: { page?: number; pageSize?: number; limit?: number },
  defaults: PageParams = { page: 1, pageSize: 20 },
): PageParams {
  const page = Math.max(1, Math.floor(input.page ?? defaults.page));
  const rawSize = input.pageSize ?? input.limit ?? defaults.pageSize;
  const pageSize = Math.min(100, Math.max(1, Math.floor(rawSize)));
  return { page, pageSize };
}

export function pageRange(params: PageParams): { from: number; to: number } {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  return { from, to };
}

export function buildPageMeta(params: PageParams, total: number): PageMeta {
  return {
    ...params,
    total,
    hasMore: params.page * params.pageSize < total,
  };
}

export function slicePage<T>(items: T[], params: PageParams): { items: T[]; meta: PageMeta } {
  const total = items.length;
  const start = (params.page - 1) * params.pageSize;
  return {
    items: items.slice(start, start + params.pageSize),
    meta: buildPageMeta(params, total),
  };
}
