/**
 * Maps Axios / network failures to a short student-facing message.
 * Why: screens should not parse Axios shapes ad hoc.
 */
import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (isAxiosError(error)) {
    const apiMessage = (error.response?.data as { error?: { message?: string } } | undefined)
      ?.error?.message;
    if (apiMessage) {
      return apiMessage;
    }
    if (!error.response) {
      return 'Network error. Check your connection and try again.';
    }
    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
