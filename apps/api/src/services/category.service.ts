/**
 * Category reads/writes from Supabase (via API service role).
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type { Category } from '@sharanam/shared';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../validators/category.validators';

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

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
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

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', categoryId)
    .select(CATEGORY_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'CATEGORY_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  }
  return data as Category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) {
    throw new AppError(400, 'CATEGORY_DELETE_FAILED', error.message);
  }
}
