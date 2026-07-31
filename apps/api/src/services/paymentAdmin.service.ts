/**
 * paymentAdmin.service.ts
 *
 * Admin Payment Management:
 * - KPI stats (today / monthly revenue, totals, pending, failed)
 * - Searchable order list
 * - CSV export
 *
 * Revenue counts only status=paid (amount_paise). Timezone: Asia/Kolkata.
 */
import type {
  PaymentAdminCsvExport,
  PaymentAdminListPage,
  PaymentAdminOrder,
  PaymentAdminStats,
  PaymentOrderStatus,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type {
  AdminExportPaymentsQuery,
  AdminListPaymentsQuery,
} from '../validators/paymentAdmin.validators';

const TZ = 'Asia/Kolkata';

function formatInrFromPaise(amountPaise: number): string {
  return `₹${Math.round(amountPaise / 100).toLocaleString('en-IN')}`;
}

/** Calendar day bounds in Asia/Kolkata as UTC Date objects. */
export function kolkataDayBounds(now = new Date()): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return {
    start: new Date(`${y}-${m}-${d}T00:00:00+05:30`),
    end: new Date(`${y}-${m}-${d}T23:59:59.999+05:30`),
  };
}

/** Current calendar month bounds in Asia/Kolkata. */
export function kolkataMonthBounds(now = new Date()): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const y = Number(parts.find((p) => p.type === 'year')?.value ?? '1970');
  const m = Number(parts.find((p) => p.type === 'month')?.value ?? '01');
  const start = new Date(`${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-01T00:00:00+05:30`);
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const end = new Date(
    new Date(
      `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+05:30`,
    ).getTime() - 1,
  );
  return { start, end };
}

type OrderRow = {
  id: string;
  user_id: string;
  course_id: string | null;
  product_id: string | null;
  amount_paise: number;
  currency: string;
  status: PaymentOrderStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  receipt: string;
  metadata: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
};

async function sumPaidRevenueBetween(start: Date, end: Date): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('payment_orders')
    .select('amount_paise')
    .eq('status', 'paid')
    .gte('paid_at', start.toISOString())
    .lte('paid_at', end.toISOString());

  if (error) {
    throw new AppError(500, 'PAYMENT_STATS_FAILED', error.message);
  }

  return (data ?? []).reduce((sum, row) => sum + (Number(row.amount_paise) || 0), 0);
}

async function countByStatus(status?: PaymentOrderStatus): Promise<number> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('payment_orders')
    .select('id', { count: 'exact', head: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { count, error } = await query;
  if (error) {
    throw new AppError(500, 'PAYMENT_STATS_FAILED', error.message);
  }
  return count ?? 0;
}

/** GET /admin/payments/stats */
export async function getAdminPaymentStats(): Promise<PaymentAdminStats> {
  const day = kolkataDayBounds();
  const month = kolkataMonthBounds();

  const [
    today_revenue_paise,
    monthly_revenue_paise,
    total_orders,
    pending_payments,
    failed_payments,
    paid_orders,
  ] = await Promise.all([
    sumPaidRevenueBetween(day.start, day.end),
    sumPaidRevenueBetween(month.start, month.end),
    countByStatus(),
    countByStatus('created'),
    countByStatus('failed'),
    countByStatus('paid'),
  ]);

  return {
    today_revenue_paise,
    today_revenue_display: formatInrFromPaise(today_revenue_paise),
    monthly_revenue_paise,
    monthly_revenue_display: formatInrFromPaise(monthly_revenue_paise),
    total_orders,
    pending_payments,
    failed_payments,
    paid_orders,
    timezone: TZ,
  };
}

async function enrichOrders(rows: OrderRow[]): Promise<PaymentAdminOrder[]> {
  const supabase = getSupabaseAdmin();
  const courseIds = [
    ...new Set(rows.map((r) => r.course_id).filter((id): id is string => Boolean(id))),
  ];
  const productIds = [
    ...new Set(rows.map((r) => r.product_id).filter((id): id is string => Boolean(id))),
  ];
  const userIds = [...new Set(rows.map((r) => r.user_id))];

  const [{ data: courses }, { data: products }, { data: profiles }] = await Promise.all([
    courseIds.length
      ? supabase.from('courses').select('id, title').in('id', courseIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    productIds.length
      ? supabase.from('products').select('id, title').in('id', productIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    userIds.length
      ? supabase.from('profiles').select('id, email').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; email: string | null }[] }),
  ]);

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));
  const productMap = new Map((products ?? []).map((p) => [p.id, p.title]));
  const emailMap = new Map((profiles ?? []).map((p) => [p.id, p.email ?? null]));

  return rows.map((row) => {
    const metaTitle =
      (row.metadata && typeof row.metadata.product_title === 'string'
        ? row.metadata.product_title
        : null) ??
      (row.metadata && typeof row.metadata.course_title === 'string'
        ? row.metadata.course_title
        : null);
    const title =
      (row.product_id ? productMap.get(row.product_id) : undefined) ??
      (row.course_id ? courseMap.get(row.course_id) : undefined) ??
      metaTitle ??
      'Product';
    return {
      order_id: row.id,
      course_id: row.course_id ?? '',
      course_title: title,
      user_id: row.user_id,
      student_email: emailMap.get(row.user_id) ?? null,
      amount_paise: row.amount_paise,
      amount_display: formatInrFromPaise(row.amount_paise),
      currency: row.currency,
      status: row.status,
      payment_id: row.razorpay_payment_id,
      razorpay_order_id: row.razorpay_order_id,
      receipt_number: row.receipt,
      date: row.paid_at ?? row.created_at,
      created_at: row.created_at,
    };
  });
}

function applySearchFilter(rows: PaymentAdminOrder[], search: string): PaymentAdminOrder[] {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const hay = [
      row.course_title,
      row.student_email ?? '',
      row.payment_id ?? '',
      row.razorpay_order_id ?? '',
      row.receipt_number,
      row.order_id,
      row.status,
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

/** GET /admin/payments */
export async function listAdminPayments(
  query: AdminListPaymentsQuery,
): Promise<PaymentAdminListPage> {
  const supabase = getSupabaseAdmin();
  const page = query.page;
  const pageSize = query.pageSize;

  // Fetch a wider window when searching (filter in memory after enrich)
  const searching = Boolean(query.search?.trim());
  const fetchLimit = searching ? 500 : pageSize;
  const from = searching ? 0 : (page - 1) * pageSize;
  const to = searching ? fetchLimit - 1 : from + pageSize - 1;

  let dbQuery = supabase
    .from('payment_orders')
    .select(
      'id, user_id, course_id, product_id, amount_paise, currency, status, razorpay_order_id, razorpay_payment_id, receipt, metadata, paid_at, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (query.status !== 'all') {
    dbQuery = dbQuery.eq('status', query.status);
  }

  const { data, error, count } = await dbQuery;
  if (error) {
    throw new AppError(500, 'PAYMENT_LIST_FAILED', error.message);
  }

  let items = await enrichOrders((data ?? []) as OrderRow[]);
  items = applySearchFilter(items, query.search ?? '');

  if (searching) {
    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    return {
      items: pageItems,
      page,
      pageSize,
      total,
      hasMore: start + pageItems.length < total,
    };
  }

  const total = count ?? items.length;
  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
  };
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** GET /admin/payments/export */
export async function exportAdminPaymentsCsv(
  query: AdminExportPaymentsQuery,
): Promise<PaymentAdminCsvExport> {
  const items: PaymentAdminOrder[] = [];
  let pageNum = 1;
  let hasMore = true;

  while (hasMore && items.length < 1000 && pageNum <= 10) {
    const page = await listAdminPayments({
      search: query.search,
      status: query.status,
      page: pageNum,
      pageSize: 100,
    });
    items.push(...page.items);
    hasMore = page.hasMore;
    pageNum += 1;
  }

  const header = [
    'Order ID',
    'Course',
    'Student Email',
    'Amount',
    'Currency',
    'Status',
    'Payment ID',
    'Razorpay Order ID',
    'Receipt',
    'Date',
  ];

  const lines = [
    header.join(','),
    ...items.map((row) =>
      [
        row.order_id,
        row.course_title,
        row.student_email ?? '',
        String(row.amount_paise / 100),
        row.currency,
        row.status,
        row.payment_id ?? '',
        row.razorpay_order_id ?? '',
        row.receipt_number,
        row.date,
      ]
        .map((cell) => csvEscape(String(cell)))
        .join(','),
    ),
  ];

  const day = new Date().toISOString().slice(0, 10);
  return {
    filename: `sharanam-payments-${day}.csv`,
    csv: `${lines.join('\n')}\n`,
  };
}
