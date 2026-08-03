/**
 * PostgREST / Supabase filter safety.
 * Never interpolate raw user search into `.or()` / `.ilike()` without escaping.
 */
const FILTER_UNSAFE = /[,.()"'\\]|%|_/g;

/**
 * Strip characters that break PostgREST filter expressions and limit length.
 * Use for every client-supplied search string in `.or(\`col.ilike.%${q}%\`)`.
 */
export function sanitizeSearchTerm(raw: string, maxLen = 80): string {
  return raw
    .normalize('NFKC')
    .replace(FILTER_UNSAFE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/** Escape `%` / `_` for ILIKE patterns after sanitizeSearchTerm. */
export function escapeIlike(raw: string): string {
  return sanitizeSearchTerm(raw).replace(/\\/g, '').replace(/%/g, '').replace(/_/g, '');
}
