/**
 * Checks whether the batch architecture migration has been applied.
 * Never prints secrets — only pass/fail per table/column.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(__dirname, '../apps/api/.env') });

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log('MISSING_SUPABASE_ENV');
    return;
  }
  const supabase = createClient(url, key);

  const checks: [string, () => PromiseLike<{ error: { message: string } | null }>][] = [
    ['subjects table', () => supabase.from('subjects').select('id').limit(1)],
    ['batch_subjects table', () => supabase.from('batch_subjects').select('id').limit(1)],
    [
      'courses.original_price column',
      () => supabase.from('courses').select('id, original_price').limit(1),
    ],
    [
      'chapters.batch_subject_id column',
      () => supabase.from('chapters').select('id, batch_subject_id').limit(1),
    ],
    [
      'tests.batch_subject_id column',
      () => supabase.from('tests').select('id, batch_subject_id').limit(1),
    ],
    [
      'live_classes.subject_id column',
      () => supabase.from('live_classes').select('id, subject_id').limit(1),
    ],
  ];

  for (const [name, run] of checks) {
    const { error } = await run();
    console.log(`${error ? 'FAIL' : 'OK  '} ${name}${error ? ` -> ${error.message}` : ''}`);
  }
}

void main();
