/**
 * Banner catalog + admin CRUD (service role).
 * Columns: id, title, image, redirect_url, status, sort_order (+ optional subtitle).
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type { Banner } from '@sharanam/shared';
import type {
  CreateBannerInput,
  UpdateBannerInput,
} from '../validators/banner.validators';

const BANNER_COLUMNS =
  'id, title, subtitle, image, redirect_url, status, sort_order';

export async function listActiveBanners(): Promise<Banner[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('banners')
    .select(BANNER_COLUMNS)
    .eq('status', 'active')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError(500, 'BANNERS_FETCH_FAILED', error.message);
  }
  return (data ?? []) as Banner[];
}

export async function listAllBannersForAdmin(): Promise<Banner[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('banners')
    .select(BANNER_COLUMNS)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError(500, 'BANNERS_FETCH_FAILED', error.message);
  }
  return (data ?? []) as Banner[];
}

export async function createBanner(input: CreateBannerInput): Promise<Banner> {
  const supabase = getSupabaseAdmin();

  const { count, error: countError } = await supabase
    .from('banners')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    throw new AppError(500, 'BANNERS_FETCH_FAILED', countError.message);
  }
  if ((count ?? 0) >= 20) {
    throw new AppError(400, 'BANNER_LIMIT', 'Maximum 20 banners allowed for the home slider');
  }

  const { data, error } = await supabase
    .from('banners')
    .insert(input)
    .select(BANNER_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'BANNER_CREATE_FAILED', error.message);
  }
  return data as Banner;
}

export async function updateBanner(
  bannerId: string,
  input: UpdateBannerInput,
): Promise<Banner> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('banners')
    .update(input)
    .eq('id', bannerId)
    .select(BANNER_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(400, 'BANNER_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'BANNER_NOT_FOUND', 'Banner not found');
  }
  return data as Banner;
}

export async function deleteBanner(bannerId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error, count } = await supabase
    .from('banners')
    .delete({ count: 'exact' })
    .eq('id', bannerId);

  if (error) {
    throw new AppError(400, 'BANNER_DELETE_FAILED', error.message);
  }
  if (!count) {
    throw new AppError(404, 'BANNER_NOT_FOUND', 'Banner not found');
  }
}
