/**
 * devicePush.service.ts — register / refresh / deactivate push tokens.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type {
  DeactivatePushTokenInput,
  UpsertPushTokenInput,
} from '../validators/devicePush.validators';

export type DevicePushTokenRecord = {
  id: string;
  user_id: string;
  device_id: string;
  token: string;
  provider: 'fcm' | 'apns' | 'expo';
  platform: 'ios' | 'android' | 'web';
  app_version: string | null;
  is_active: boolean;
  last_seen_at: string;
};

const COLUMNS =
  'id, user_id, device_id, token, provider, platform, app_version, is_active, last_seen_at';

export async function upsertDevicePushToken(
  userId: string,
  input: UpsertPushTokenInput,
): Promise<DevicePushTokenRecord> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  // If this exact token was previously owned by another user/device, deactivate it.
  await supabase
    .from('device_push_tokens')
    .update({ is_active: false, updated_at: now })
    .eq('token', input.token)
    .neq('user_id', userId);

  const { data, error } = await supabase
    .from('device_push_tokens')
    .upsert(
      {
        user_id: userId,
        device_id: input.device_id,
        token: input.token,
        provider: input.provider,
        platform: input.platform,
        app_version: input.app_version ?? null,
        is_active: true,
        last_seen_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id,device_id' },
    )
    .select(COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError(
      500,
      'PUSH_TOKEN_UPSERT_FAILED',
      error?.message ?? 'Could not store push token',
    );
  }

  return data as DevicePushTokenRecord;
}

export async function deactivateDevicePushToken(
  userId: string,
  input: DeactivatePushTokenInput,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('device_push_tokens')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (input.device_id) {
    query = query.eq('device_id', input.device_id);
  }
  if (input.token) {
    query = query.eq('token', input.token);
  }

  const { error } = await query;
  if (error) {
    throw new AppError(500, 'PUSH_TOKEN_DEACTIVATE_FAILED', error.message);
  }
}

export async function listActiveTokensForUser(
  userId: string,
): Promise<DevicePushTokenRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('device_push_tokens')
    .select(COLUMNS)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    throw new AppError(500, 'PUSH_TOKEN_LIST_FAILED', error.message);
  }
  return (data ?? []) as DevicePushTokenRecord[];
}

/** Batch load active tokens for many users (fan-out). */
export async function listActiveTokensForUsers(
  userIds: string[],
): Promise<DevicePushTokenRecord[]> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('device_push_tokens')
    .select(COLUMNS)
    .in('user_id', unique)
    .eq('is_active', true);

  if (error) {
    throw new AppError(500, 'PUSH_TOKEN_LIST_FAILED', error.message);
  }
  return (data ?? []) as DevicePushTokenRecord[];
}

/** Mark tokens inactive after FCM reports them invalid. */
export async function deactivateTokensByValue(tokens: string[]): Promise<void> {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('device_push_tokens')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .in('token', unique);

  if (error) {
    throw new AppError(500, 'PUSH_TOKEN_DEACTIVATE_FAILED', error.message);
  }
}
