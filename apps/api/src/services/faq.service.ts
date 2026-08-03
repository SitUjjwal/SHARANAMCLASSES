/**
 * FAQ service — student search + admin CRUD / reorder.
 */
import type { CreateFaqInput, Faq, UpdateFaqInput } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { sanitizeSearchTerm } from '../utils/postgrestSafe';

const COLUMNS =
  'id, question, answer, category, sort_order, is_published, created_at, updated_at';

type Row = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

function mapFaq(row: Row): Faq {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    sort_order: Number(row.sort_order) || 0,
    is_published: Boolean(row.is_published),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Student: published FAQs, optional search on question/answer. */
export async function listPublishedFaqs(search?: string): Promise<Faq[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('faqs')
    .select(COLUMNS)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(200);

  const q = sanitizeSearchTerm(search?.trim() ?? '');
  if (q) {
    query = query.or(`question.ilike.%${q}%,answer.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'FAQ_FETCH_FAILED', error.message);
  }
  return ((data ?? []) as Row[]).map(mapFaq);
}

export async function listAdminFaqs(): Promise<Faq[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('faqs')
    .select(COLUMNS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) {
    throw new AppError(500, 'FAQ_FETCH_FAILED', error.message);
  }
  return ((data ?? []) as Row[]).map(mapFaq);
}

export async function createFaq(
  input: CreateFaqInput,
  adminUserId: string,
): Promise<Faq> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  let sortOrder = input.sort_order;
  if (sortOrder === undefined) {
    const { data: last } = await supabase
      .from('faqs')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (Number(last?.sort_order) || 0) + 10;
  }

  const { data, error } = await supabase
    .from('faqs')
    .insert({
      question: input.question.trim(),
      answer: input.answer.trim(),
      category: input.category?.trim() || null,
      sort_order: sortOrder,
      is_published: input.is_published ?? true,
      created_by: adminUserId,
      created_at: now,
      updated_at: now,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'FAQ_CREATE_FAILED', error.message);
  }
  return mapFaq(data as Row);
}

export async function updateFaq(
  faqId: string,
  input: UpdateFaqInput,
): Promise<Faq> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.question !== undefined) patch.question = input.question.trim();
  if (input.answer !== undefined) patch.answer = input.answer.trim();
  if (input.category !== undefined) {
    patch.category = input.category?.trim() || null;
  }
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_published !== undefined) patch.is_published = input.is_published;

  const { data, error } = await supabase
    .from('faqs')
    .update(patch)
    .eq('id', faqId)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'FAQ_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'FAQ_NOT_FOUND', 'FAQ not found');
  }
  return mapFaq(data as Row);
}

export async function deleteFaq(faqId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', faqId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'FAQ_DELETE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'FAQ_NOT_FOUND', 'FAQ not found');
  }
}

export async function reorderFaqs(orderedIds: string[]): Promise<Faq[]> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: listError } = await supabase
    .from('faqs')
    .select('id');

  if (listError) {
    throw new AppError(500, 'FAQ_FETCH_FAILED', listError.message);
  }

  const existingIds = new Set((existing ?? []).map((row) => row.id as string));
  if (existingIds.size !== orderedIds.length) {
    throw new AppError(
      400,
      'FAQ_REORDER_MISMATCH',
      'ordered_ids must include every FAQ exactly once',
    );
  }
  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      throw new AppError(400, 'FAQ_REORDER_INVALID', `Unknown FAQ id: ${id}`);
    }
  }

  const now = new Date().toISOString();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('faqs')
        .update({ sort_order: (index + 1) * 10, updated_at: now })
        .eq('id', id),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new AppError(500, 'FAQ_REORDER_FAILED', failed.error.message);
  }

  return listAdminFaqs();
}
