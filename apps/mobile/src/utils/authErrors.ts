/**
 * Maps Supabase / network failures to user-friendly login errors.
 * Why: raw SDK messages are unclear; UI needs Wrong password / User not found / Network.
 */
export type AuthErrorCode =
  | 'WRONG_PASSWORD'
  | 'USER_NOT_FOUND'
  | 'EMAIL_NOT_CONFIRMED'
  | 'NETWORK'
  | 'UNKNOWN';

export class AuthAppError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthAppError';
    this.code = code;
  }
}

/**
 * isNetworkError
 * Detects offline / DNS / connection failures from fetch/Axios-like errors.
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  return (
    name === 'typeerror' ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('internet') ||
    message.includes('timeout')
  );
}

/**
 * getErrorMessage
 * Safely reads `.message` from unknown thrown values.
 */
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
}

/**
 * mapLoginError
 * Converts a thrown error into AuthAppError with a clear student-facing message.
 */
export function mapLoginError(error: unknown): AuthAppError {
  if (error instanceof AuthAppError) {
    return error;
  }

  if (isNetworkError(error)) {
    return new AuthAppError(
      'NETWORK',
      'Network error. Check your internet connection and try again.',
    );
  }

  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return new AuthAppError(
      'EMAIL_NOT_CONFIRMED',
      'Please confirm your email before signing in.',
    );
  }

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('wrong password') ||
    lower.includes('invalid email or password')
  ) {
    return new AuthAppError(
      'WRONG_PASSWORD',
      'Wrong email or password. Please try again.',
    );
  }

  if (
    lower.includes('user not found') ||
    lower.includes('no user found') ||
    lower.includes('user does not exist')
  ) {
    return new AuthAppError('USER_NOT_FOUND', 'No account found with this email.');
  }

  return new AuthAppError('UNKNOWN', message);
}

/**
 * mapForgotPasswordError
 * Maps reset-password failures (network / rate limit / invalid email).
 */
export function mapForgotPasswordError(error: unknown): AuthAppError {
  if (error instanceof AuthAppError) {
    return error;
  }

  if (isNetworkError(error)) {
    return new AuthAppError(
      'NETWORK',
      'Network error. Check your internet connection and try again.',
    );
  }

  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  if (lower.includes('rate limit') || lower.includes('too many')) {
    return new AuthAppError(
      'UNKNOWN',
      'Too many reset attempts. Please wait a minute and try again.',
    );
  }

  if (lower.includes('user not found') || lower.includes('no user')) {
    // Still show a generic success-like privacy message in UI often,
    // but if Supabase returns this explicitly we surface it.
    return new AuthAppError('USER_NOT_FOUND', 'No account found with this email.');
  }

  return new AuthAppError('UNKNOWN', message);
}

/**
 * mapResetPasswordError
 * Maps failures while setting a new password after the email link.
 */
export function mapResetPasswordError(error: unknown): AuthAppError {
  if (error instanceof AuthAppError) {
    return error;
  }

  if (isNetworkError(error)) {
    return new AuthAppError(
      'NETWORK',
      'Network error. Check your internet connection and try again.',
    );
  }

  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  if (
    lower.includes('session') ||
    lower.includes('not authenticated') ||
    lower.includes('jwt') ||
    lower.includes('expired')
  ) {
    return new AuthAppError(
      'UNKNOWN',
      'This reset link is invalid or expired. Request a new one from Forgot password.',
    );
  }

  if (lower.includes('same password') || lower.includes('different from the old')) {
    return new AuthAppError(
      'UNKNOWN',
      'Choose a password that is different from your current one.',
    );
  }

  return new AuthAppError('UNKNOWN', message);
}
