/**
 * Recursively sanitize string fields in JSON bodies to reduce stored XSS risk.
 * Strips HTML tags / javascript: / event handlers. Keeps plain text + markdown-ish content.
 */
const TAG_RE = /<\/?[^>]+>/g;
const JS_URI_RE = /^\s*javascript:/i;
const EVENT_RE = /\son\w+\s*=/gi;

function scrubString(value: string): string {
  return value
    .replace(TAG_RE, '')
    .replace(EVENT_RE, ' ')
    .replace(JS_URI_RE, '')
    .trim();
}

function scrubValue(value: unknown, depth: number): unknown {
  if (depth > 8) return value;
  if (typeof value === 'string') return scrubString(value);
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = scrubValue(nested, depth + 1);
    }
    return out;
  }
  return value;
}

/**
 * Mutates req.body string leaves to remove HTML/script vectors.
 * Runs after JSON parse, before route validators.
 */
export function sanitizeRequestBody(
  req: { body?: unknown },
  _res: unknown,
  next: (err?: unknown) => void,
): void {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = scrubValue(req.body, 0);
    }
    next();
  } catch (error) {
    next(error);
  }
}
