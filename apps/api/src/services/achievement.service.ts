/**
 * Achievements catalog + per-user unlocks.
 */
import type { Achievement } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export async function listAchievementsForUser(userId: string): Promise<Achievement[]> {
  const supabase = getSupabaseAdmin();

  const [{ data: catalog, error: catalogError }, { data: unlocked, error: unlockError }] =
    await Promise.all([
      supabase
        .from('achievements')
        .select('id, code, title, description, icon, sort_order')
        .order('sort_order', { ascending: true }),
      supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId),
    ]);

  if (catalogError) {
    throw new AppError(500, 'ACHIEVEMENTS_LIST_FAILED', catalogError.message);
  }
  if (unlockError) {
    throw new AppError(500, 'ACHIEVEMENTS_UNLOCK_FAILED', unlockError.message);
  }

  const unlockedMap = new Map(
    (unlocked ?? []).map((row) => [
      row.achievement_id as string,
      row.unlocked_at as string,
    ]),
  );

  return (catalog ?? []).map((row) => {
    const unlockedAt = unlockedMap.get(row.id as string) ?? null;
    return {
      id: row.id as string,
      code: row.code as string,
      title: row.title as string,
      description: (row.description as string) ?? '',
      icon: (row.icon as string | null) ?? null,
      sort_order: Number(row.sort_order) || 0,
      unlocked: Boolean(unlockedAt),
      unlocked_at: unlockedAt,
    };
  });
}
