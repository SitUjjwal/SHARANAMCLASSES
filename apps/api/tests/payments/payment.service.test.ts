/**
 * Unit tests: payment validators + amount helper + verify flow with mocks.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../src/utils/AppError';
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
} from '../../src/validators/payment.validators';
import type {
  IPaymentOrderRepository,
  IProductRepository,
  IPurchaseRepository,
  PaymentOrderRow,
  ProductRow,
} from '../../src/repositories';
import { computePaymentSignature } from '../../src/integrations/razorpay/signature';

vi.mock('../../src/config/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('../../src/integrations/razorpay/client', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/integrations/razorpay/client')
  >('../../src/integrations/razorpay/client');
  return {
    ...actual,
    createRazorpayOrder: vi.fn(),
    fetchRazorpayPayment: vi.fn(),
    getRazorpayKeyId: vi.fn(() => 'rzp_test_unit'),
    assertRazorpayConfigured: vi.fn(),
    isRazorpayConfigured: vi.fn(() => true),
  };
});

import { getSupabaseAdmin } from '../../src/config/supabase';
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
} from '../../src/integrations/razorpay/client';
import {
  createPaymentOrder,
  rupeesToPaise,
  verifyPayment,
} from '../../src/services/payment.service';

const COURSE_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const ORDER_UUID = '33333333-3333-3333-3333-333333333333';
const PRODUCT_ID = '44444444-4444-4444-4444-444444444444';

function courseProduct(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: PRODUCT_ID,
    product_type: 'course',
    product_id: COURSE_ID,
    title: 'Class 10 Maths',
    price: 499,
    currency: 'INR',
    is_active: true,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function mockProducts(): IProductRepository {
  const product = courseProduct();
  return {
    findById: vi.fn(async (id) => (id === PRODUCT_ID ? product : null)),
    findByTypeAndEntity: vi.fn(async () => product),
    upsertCourseProduct: vi.fn(async () => product),
  };
}

function mockCatalogPurchases(): IPurchaseRepository {
  return {
    findByUserAndProduct: vi.fn(async () => null),
    insert: vi.fn(async (input) => ({
      id: 'catalog-purchase-1',
      user_id: input.user_id,
      product_id: input.product_id,
      payment_order_id: input.payment_order_id,
      razorpay_payment_id: input.razorpay_payment_id,
      amount_paise: input.amount_paise,
      currency: input.currency,
      purchased_at: input.purchased_at ?? new Date().toISOString(),
      created_at: new Date().toISOString(),
    })),
  };
}

function mockSupabaseChain(result: { data: unknown; error: null | { message: string; code?: string } }) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  for (const method of [
    'from',
    'select',
    'eq',
    'insert',
    'update',
    'maybeSingle',
    'single',
  ]) {
    chain[method] = vi.fn(self);
  }
  chain.maybeSingle = vi.fn(async () => result);
  chain.single = vi.fn(async () => result);
  (chain.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (getSupabaseAdmin as unknown as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
}

describe('payment validators', () => {
  it('accepts a valid create-order body', () => {
    const parsed = createPaymentOrderSchema.parse({ course_id: COURSE_ID });
    expect(parsed.course_id).toBe(COURSE_ID);
  });

  it('rejects create-order without course_id', () => {
    expect(() => createPaymentOrderSchema.parse({})).toThrow();
  });

  it('rejects client-supplied amount fields (they are not in schema)', () => {
    const parsed = createPaymentOrderSchema.parse({
      course_id: COURSE_ID,
      amount: 1,
    } as { course_id: string });
    expect(parsed).toEqual({ course_id: COURSE_ID });
  });

  it('requires verify payload fields', () => {
    expect(() => verifyPaymentSchema.parse({})).toThrow();
    const ok = verifyPaymentSchema.parse({
      razorpay_order_id: 'order_abc',
      razorpay_payment_id: 'pay_abc',
      razorpay_signature: 'a'.repeat(64),
    });
    expect(ok.razorpay_order_id).toBe('order_abc');
  });
});

describe('rupeesToPaise', () => {
  it('converts INR to paise', () => {
    expect(rupeesToPaise(499)).toBe(49900);
    expect(rupeesToPaise(99.5)).toBe(9950);
  });

  it('rejects non-positive amounts', () => {
    expect(() => rupeesToPaise(0)).toThrow(AppError);
    expect(() => rupeesToPaise(-10)).toThrow(AppError);
  });
});

describe('createPaymentOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a Razorpay order using server-side course price', async () => {
    const supabase = mockSupabaseChain({ data: null, error: null });
    // First maybeSingle: course; second: enrollment check
    let call = 0;
    supabase.maybeSingle = vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return {
          data: {
            id: COURSE_ID,
            title: 'Class 10 Maths',
            price: 499,
            is_free: false,
            is_published: true,
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    (createRazorpayOrder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'order_Rzp1',
      entity: 'order',
      amount: 49900,
      amount_paid: 0,
      amount_due: 49900,
      currency: 'INR',
      receipt: 'rcpt',
      status: 'created',
    });

    const repo: IPaymentOrderRepository = {
      insert: vi.fn(async (input) => ({
        id: ORDER_UUID,
        user_id: input.user_id,
        course_id: input.course_id ?? null,
        product_id: input.product_id,
        amount_paise: input.amount_paise,
        currency: input.currency,
        status: 'created',
        razorpay_order_id: input.razorpay_order_id,
        razorpay_payment_id: null,
        razorpay_signature: null,
        receipt: input.receipt,
        metadata: {},
        paid_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      findById: vi.fn(),
      findByRazorpayOrderId: vi.fn(),
      findByRazorpayPaymentId: vi.fn(),
      listByUserId: vi.fn(),
      markPaid: vi.fn(),
      markFailed: vi.fn(),
    };

    const result = await createPaymentOrder(
      USER_ID,
      { course_id: COURSE_ID },
      {
        orders: repo,
        products: mockProducts(),
        catalogPurchases: mockCatalogPurchases(),
      },
    );

    expect(createRazorpayOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amountPaise: 49900, currency: 'INR' }),
    );
    expect(result.amount_paise).toBe(49900);
    expect(result.key_id).toBe('rzp_test_unit');
    expect(result.razorpay_order_id).toBe('order_Rzp1');
    expect(result.product_id).toBe(PRODUCT_ID);
    expect(repo.insert).toHaveBeenCalled();
  });

  it('rejects free courses', async () => {
    const supabase = mockSupabaseChain({ data: null, error: null });
    supabase.maybeSingle = vi.fn(async () => ({
      data: {
        id: COURSE_ID,
        title: 'Free Course',
        price: 0,
        is_free: true,
        is_published: true,
      },
      error: null,
    }));

    await expect(
      createPaymentOrder(
        USER_ID,
        { course_id: COURSE_ID },
        {
          orders: {
            insert: vi.fn(),
            findById: vi.fn(),
            findByRazorpayOrderId: vi.fn(),
            findByRazorpayPaymentId: vi.fn(),
            listByUserId: vi.fn(),
            markPaid: vi.fn(),
            markFailed: vi.fn(),
          },
          products: mockProducts(),
          catalogPurchases: mockCatalogPurchases(),
        },
      ),
    ).rejects.toMatchObject({ code: 'COURSE_IS_FREE' });
  });
});

describe('verifyPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies signature, checks Razorpay payment, marks paid', async () => {
    const razorpayOrderId = 'order_Rzp1';
    const paymentId = 'pay_Rzp1';
    const signature = computePaymentSignature(
      razorpayOrderId,
      paymentId,
      'test_secret_key_for_hmac',
    );

    const createdRow: PaymentOrderRow = {
      id: ORDER_UUID,
      user_id: USER_ID,
      course_id: COURSE_ID,
      product_id: PRODUCT_ID,
      amount_paise: 49900,
      currency: 'INR',
      status: 'created',
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: null,
      razorpay_signature: null,
      receipt: 'rcpt',
      metadata: {},
      paid_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const repo: IPaymentOrderRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByRazorpayOrderId: vi.fn(async () => createdRow),
      findByRazorpayPaymentId: vi.fn(),
      listByUserId: vi.fn(),
      markPaid: vi.fn(async () => ({
        ...createdRow,
        status: 'paid',
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        paid_at: '2026-08-01T00:00:00.000Z',
      })),
      markFailed: vi.fn(),
    };

    (fetchRazorpayPayment as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: paymentId,
      entity: 'payment',
      amount: 49900,
      currency: 'INR',
      status: 'captured',
      order_id: razorpayOrderId,
    });

    // enrollment checks: not enrolled → insert ok
    const supabase = mockSupabaseChain({ data: null, error: null });
    let enrollCalls = 0;
    supabase.maybeSingle = vi.fn(async () => {
      enrollCalls += 1;
      return { data: null, error: null };
    });
    supabase.single = vi.fn(async () => ({ data: { id: 'enr' }, error: null }));
    // insert returns chain ending in... grantEnrollment uses .insert without select
    supabase.insert = vi.fn(async () => ({ data: { id: 'enr' }, error: null }));

    const purchases = {
      findByUserAndCourse: vi.fn(),
      insert: vi.fn(async (input) => ({
        id: 'purchase-1',
        user_id: input.user_id,
        course_id: input.course_id,
        payment_order_id: input.payment_order_id,
        razorpay_payment_id: input.razorpay_payment_id,
        amount_paise: input.amount_paise,
        currency: input.currency,
        purchased_at: input.purchased_at ?? '2026-08-01T00:00:00.000Z',
        created_at: '2026-08-01T00:00:00.000Z',
      })),
    };

    const result = await verifyPayment(
      USER_ID,
      {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
      { orders: repo, purchases, products: mockProducts(), catalogPurchases: mockCatalogPurchases() },
    );

    expect(result.status).toBe('paid');
    expect(result.course_id).toBe(COURSE_ID);
    expect(result.product_id).toBe(PRODUCT_ID);
    expect(result.purchased).toBe(true);
    expect(result.unlocked).toBe(true);
    expect(result.enrolled).toBe(true);
    expect(repo.markPaid).toHaveBeenCalled();
    expect(purchases.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        course_id: COURSE_ID,
        razorpay_payment_id: paymentId,
      }),
    );
    expect(fetchRazorpayPayment).toHaveBeenCalledWith(paymentId);
    void enrollCalls;
  });

  it('rejects invalid payment signatures before unlocking', async () => {
    const repo: IPaymentOrderRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByRazorpayOrderId: vi.fn(),
      findByRazorpayPaymentId: vi.fn(),
      listByUserId: vi.fn(),
      markPaid: vi.fn(),
      markFailed: vi.fn(),
    };
    const purchases = {
      findByUserAndCourse: vi.fn(),
      insert: vi.fn(),
    };

    await expect(
      verifyPayment(
        USER_ID,
        {
          razorpay_order_id: 'order_Rzp1',
          razorpay_payment_id: 'pay_Rzp1',
          razorpay_signature: 'a'.repeat(64),
        },
        {
          orders: repo,
          purchases,
          products: mockProducts(),
          catalogPurchases: mockCatalogPurchases(),
        },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_PAYMENT_SIGNATURE' });

    expect(repo.findByRazorpayOrderId).not.toHaveBeenCalled();
    expect(purchases.insert).not.toHaveBeenCalled();
  });

  it('rejects amount mismatch from Razorpay', async () => {
    const razorpayOrderId = 'order_Rzp1';
    const paymentId = 'pay_Rzp1';
    const signature = computePaymentSignature(
      razorpayOrderId,
      paymentId,
      'test_secret_key_for_hmac',
    );

    const createdRow: PaymentOrderRow = {
      id: ORDER_UUID,
      user_id: USER_ID,
      course_id: COURSE_ID,
      product_id: PRODUCT_ID,
      amount_paise: 49900,
      currency: 'INR',
      status: 'created',
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: null,
      razorpay_signature: null,
      receipt: 'rcpt',
      metadata: {},
      paid_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const repo: IPaymentOrderRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByRazorpayOrderId: vi.fn(async () => createdRow),
      findByRazorpayPaymentId: vi.fn(),
      listByUserId: vi.fn(),
      markPaid: vi.fn(),
      markFailed: vi.fn(),
    };

    (fetchRazorpayPayment as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: paymentId,
      entity: 'payment',
      amount: 100,
      currency: 'INR',
      status: 'captured',
      order_id: razorpayOrderId,
    });

    await expect(
      verifyPayment(
        USER_ID,
        {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        },
        {
          orders: repo,
          products: mockProducts(),
          catalogPurchases: mockCatalogPurchases(),
        },
      ),
    ).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_MISMATCH' });

    expect(repo.markFailed).toHaveBeenCalledWith(ORDER_UUID);
  });
});
