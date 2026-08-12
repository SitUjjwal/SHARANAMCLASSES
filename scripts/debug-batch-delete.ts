/**
 * Finds which FK blocks deleting the specific courses that failed in the admin.
 * Prints only ids/counts/error messages — no secrets.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(__dirname, '../apps/api/.env') });

const COURSE_IDS = [
  'f29878f8-8e92-4078-ac55-dc43ae9b3f76',
  '0ab13933-ad9a-4b02-8261-f4f1dff23a1e',
  'bf15c188-760f-480d-bf04-dfe8a53bc794',
];

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  for (const id of COURSE_IDS) {
    const { data: course } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', id)
      .maybeSingle();
    console.log(`\n=== ${id} — ${course ? (course.title as string) : 'NOT FOUND'}`);
    if (!course) continue;

    // Dry-run delete to capture the exact FK error
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (!error) {
      console.log('  delete would SUCCEED (already deleted now!)');
      continue;
    }
    console.log(`  delete error: code=${error.code} :: ${error.message}`);
    if (error.details) console.log(`  details: ${error.details}`);
  }
}

void main();
