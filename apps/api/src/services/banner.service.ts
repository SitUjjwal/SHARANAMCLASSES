/**
 * Banner catalog + admin CRUD (service role).
 * Supports typed redirects: course | test | live_class | website.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type { Banner, BannerRedirectType } from '@sharanam/shared';
import type {
  CreateBannerInput,
  UpdateBannerInput,
} from '../validators/banner.validators';

const BANNER_COLUMNS =
  'id, title, subtitle, image, redirect_url, redirect_type, redirect_target_id, status, sort_order';

function normalizeBanner(row: Record<string, unknown>): Banner {
  return {
    id: String(row.id),
    title: String(row.title),
    subtitle: (row.subtitle as string | null) ?? null,
    image: String(row.image),
    redirect_url: (row.redirect_url as string | null) ?? null,
    redirect_type: (row.redirect_type as BannerRedirectType) ?? 'none',
    redirect_target_id: (row.redirect_target_id as string | null) ?? null,
    status: row.status === 'inactive' ? 'inactive' : 'active',
    sort_order: Number(row.sort_order) || 0,
  };
}

function shapeRedirectFields(
  input: CreateBannerInput | UpdateBannerInput,
): Record<string, unknown> {
  const type = input.redirect_type ?? 'none';
  const base: Record<string, unknown> = { ...input };

  if (type === 'none') {
    return {
      ...base,
      redirect_type: 'none',
      redirect_target_id: null,
      redirect_url: null,
    };
  }
  if (type === 'website') {
    return {
      ...base,
      redirect_type: 'website',
      redirect_target_id: null,
      redirect_url: input.redirect_url ?? null,
    };
  }
  return {
    ...base,
    redirect_type: type,
    redirect_target_id: input.redirect_target_id ?? null,
    redirect_url: input.redirect_url ?? null,
  };
}

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
  return (data ?? []).map((row) => normalizeBanner(row as Record<string, unknown>));
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
  return (data ?? []).map((row) => normalizeBanner(row as Record<string, unknown>));
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

  const payload = shapeRedirectFields(input);

  const { data, error } = await supabase
    .from('banners')
    .insert(payload)
    .select(BANNER_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'BANNER_CREATE_FAILED', error.message);
  }
  return normalizeBanner(data as Record<string, unknown>);
}

export async function updateBanner(
  bannerId: string,
  input: UpdateBannerInput,
): Promise<Banner> {
  const supabase = getSupabaseAdmin();
  const payload =
    input.redirect_type !== undefined ? shapeRedirectFields(input) : input;

  const { data, error } = await supabase
    .from('banners')
    .update(payload)
    .eq('id', bannerId)
    .select(BANNER_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(400, 'BANNER_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'BANNER_NOT_FOUND', 'Banner not found');
  }
  return normalizeBanner(data as Record<string, unknown>);
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
