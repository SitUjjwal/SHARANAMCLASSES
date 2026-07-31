import { defineConfig } from 'vitest/config';

/**
 * Vitest config for @sharanam/api.
 * Tests live under `tests/` (excluded from tsc emit via tsconfig).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
    env: {
      NODE_ENV: 'test',
      RAZORPAY_KEY_ID: 'rzp_test_unit',
      RAZORPAY_KEY_SECRET: 'test_secret_key_for_hmac',
      RAZORPAY_WEBHOOK_SECRET: 'whsec_test',
    },
  },
});
