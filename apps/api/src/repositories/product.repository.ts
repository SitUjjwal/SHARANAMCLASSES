/**
 * product.repository.ts
 *
 * Generic sellable SKUs (course, test_series, ebook, spoken_english, subscription).
 * `product_id` on this row is the polymorphic entity id (e.g. courses.id).
 * Orders reference `products.id` as the catalog SKU.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type ProductType =
  | 'course'
  | 'test_series'
  | 'spoken_english'
  | 'ebook'
  | 'subscription';

export type ProductRow = {
  id: string;
  product_type: ProductType;
  product_id: string;
  title: string;
  price: number;
  currency: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  'id, product_type, product_id, title, price, currency, is_active, metadata, created_at, updated_at';

export interface IProductRepository {
  findById(id: string): Promise<ProductRow | null>;
  findByTypeAndEntity(
    productType: ProductType,
    entityId: string,
  ): Promise<ProductRow | null>;
  upsertCourseProduct(input: {
    courseId: string;
    title: string;
    price: number;
    isActive: boolean;
  }): Promise<ProductRow>;
}

export const productRepository: IProductRepository = {
  async findById(id) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(500, 'PRODUCT_FETCH_FAILED', error.message);
    }
    return (data as ProductRow | null) ?? null;
  },

  async findByTypeAndEntity(productType, entityId) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .select(COLUMNS)
      .eq('product_type', productType)
      .eq('product_id', entityId)
      .maybeSingle();

    if (error) {
      throw new AppError(500, 'PRODUCT_FETCH_FAILED', error.message);
    }
    return (data as ProductRow | null) ?? null;
  },

  async upsertCourseProduct(input) {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('products')
      .upsert(
        {
          product_type: 'course',
          product_id: input.courseId,
          title: input.title,
          price: input.price,
          currency: 'INR',
          is_active: input.isActive,
          metadata: { synced_from: 'courses' },
          updated_at: now,
        },
        { onConflict: 'product_type,product_id' },
      )
      .select(COLUMNS)
      .single();

    if (error) {
      throw new AppError(400, 'PRODUCT_UPSERT_FAILED', error.message);
    }
    return data as ProductRow;
  },
};
