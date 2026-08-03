/**
 * Database connectivity service.
 * Why: prove PostgreSQL is reachable through Supabase before building features.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { withDbTiming } from '../monitoring/timeDb';
import { AppError } from '../utils/AppError';

export type DatabaseStatusResult = {
  status: 'Database Connected';
};

export async function checkDatabaseStatus(): Promise<DatabaseStatusResult> {
  let supabase;

  try {
    supabase = getSupabaseAdmin();
  } catch (error) {
    throw new AppError(
      503,
      'SUPABASE_NOT_CONFIGURED',
      error instanceof Error ? error.message : 'Supabase is not configured',
    );
  }

  const { error } = await withDbTiming('database-status', async () =>
    supabase.from('app_meta').select('key').limit(1),
  );

  if (error) {
    throw new AppError(503, 'DATABASE_UNAVAILABLE', error.message, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  return { status: 'Database Connected' };
}
