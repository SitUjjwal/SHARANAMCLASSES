/**
 * extractBearerToken
 * Reads `Authorization: Bearer <jwt>` from the request.
 * Returns null when the header is missing or malformed.
 */
export function extractBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}
