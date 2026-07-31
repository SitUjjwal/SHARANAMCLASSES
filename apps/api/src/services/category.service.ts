/**
 * Category reads from Supabase (via API service role).
 * Supports optional `search` for name/slug match (admin panel / Courses search later).
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type { Category } from '@sharanam/shared';

const CATEGORY_COLUMNS = 'id, name, slug, icon, sort_order, is_active';

export async function listActiveCategories(search?: string): Promise<Category[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const trimmed = search?.trim();
  if (trimmed) {
    // Strip PostgREST filter metacharacters before embedding in `.or()`
    const safe = trimmed.replace(/[%_,.()]/g, '');
    if (safe) {
      query = query.or(`name.ilike.%${safe}%,slug.ilike.%${safe}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'CATEGORIES_FETCH_FAILED', error.message);
  }
  return (data ?? []) as Category[];
}

/** Admin: all categories (active + inactive) for course assignment */
export async function listAllCategoriesForAdmin(): Promise<Category[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError(500, 'CATEGORIES_FETCH_FAILED', error.message);
  }
  return (data ?? []) as Category[];
}

export async function createCategory(input: {
  name: string;
  slug: string;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}): Promise<Category> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name,
      slug: input.slug,
      icon: input.icon ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select(CATEGORY_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'CATEGORY_CREATE_FAILED', error.message);
  }
  return data as Category;
}
