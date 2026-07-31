/**
 * Reads a single route param as string (Express 5 types allow string | string[]).
 */
import { AppError } from './AppError';

export function requireParam(
  value: string | string[] | undefined,
  name: string,
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    throw new AppError(400, 'INVALID_ID', `${name} is required`);
  }
  return raw;
}
