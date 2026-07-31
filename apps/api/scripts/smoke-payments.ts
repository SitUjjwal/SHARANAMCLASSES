/**
 * One-off smoke check: Razorpay keys + payment_orders table.
 * Run: npx tsx scripts/smoke-payments.ts
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import path from 'node:path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!keyId || !keySecret) {
    console.error('FAIL: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing');
    process.exit(1);
  }
  console.log('OK: Razorpay keys present (id starts with', keyId.slice(0, 8) + '…)');

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await razorpay.orders.create({
    amount: 100,
    currency: 'INR',
    receipt: `smoke_${Date.now()}`.slice(0, 40),
    payment_capture: true,
  });
  console.log('OK: Razorpay order created:', order.id);

  if (!url || !serviceKey) {
    console.error('FAIL: Supabase env missing');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from('payment_orders').select('id').limit(1);
  if (error) {
    console.error('FAIL: payment_orders table —', error.message);
    console.error('Apply migration: infra/supabase/migrations/20260801010000_payment_orders.sql');
    process.exit(1);
  }
  console.log('OK: payment_orders table reachable');
  console.log('Payments ready.');
}

main().catch((err) => {
  console.error('FAIL:', err instanceof Error ? err.message : err);
  process.exit(1);
});
