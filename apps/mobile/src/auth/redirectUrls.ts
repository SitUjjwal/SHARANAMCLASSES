/**
 * Auth deep-link helpers for Expo Go + production builds.
 *
 * Expo Go cannot open `sharanam://…` reliably — use Linking.createURL so
 * reset emails redirect to `exp://LAN:port/--/reset-password` during dev.
 */
import * as Linking from 'expo-linking';

/**
 * getPasswordResetRedirectUrl
 * URL passed to Supabase `resetPasswordForEmail({ redirectTo })`.
 * Must also be listed under Authentication → URL Configuration → Redirect URLs.
 */
export function getPasswordResetRedirectUrl(): string {
  return Linking.createURL('reset-password');
}
