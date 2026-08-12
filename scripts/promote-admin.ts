/**
 * One-shot: promote an email to super_admin in profiles (uses apps/api/.env).
 * Usage: npx tsx scripts/promote-admin.ts ujjwalsharan82@gmail.com
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv(path: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    let v = line.slice(i + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    map[line.slice(0, i).trim()] = v;
  }
  return map;
}

const emailArg = (process.argv[2] || '').trim().toLowerCase();
if (!emailArg || !emailArg.includes('@')) {
  console.error('Usage: npx tsx scripts/promote-admin.ts you@example.com');
  process.exit(1);
}

const env = loadEnv(resolve(process.cwd(), 'apps/api/.env'));
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/api/.env');
  process.exit(1);
}

async function main(): Promise<void> {
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Find auth user first (source of truth for login email)
  const { data: listed, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    console.error('Auth list failed:', listErr.message);
    process.exit(1);
  }
  const authUser = (listed.users ?? []).find(
    (u) => (u.email ?? '').trim().toLowerCase() === emailArg,
  );
  if (!authUser) {
    console.error(`No auth user for ${emailArg}`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: 'super_admin',
        email: authUser.email ?? emailArg,
        updated_at: now,
      })
      .eq('id', authUser.id)
      .select('id, email, role')
      .maybeSingle();
    if (error || !data) {
      console.error('Update failed:', error?.message ?? 'no row');
      process.exit(1);
    }
    console.log(`OK updated: ${data.email} → role=${data.role} (id=${data.id})`);
    return;
  }

      const fullName =
    (typeof authUser.user_metadata?.full_name === 'string' &&
      authUser.user_metadata.full_name) ||
    (typeof authUser.user_metadata?.name === 'string' && authUser.user_metadata.name) ||
    emailArg.split('@')[0] ||
    'Admin';

  const { data: inserted, error: insertErr } = await supabase
    .from('profiles')
    .insert({
      id: authUser.id,
      email: authUser.email ?? emailArg,
      full_name: fullName,
      phone_number: '0000000000',
      class_level: '9',
      medium: 'hindi',
      role: 'super_admin',
      updated_at: now,
    })
    .select('id, email, role')
    .maybeSingle();

  if (insertErr || !inserted) {
    console.error('Insert failed:', insertErr?.message ?? 'no row');
    process.exit(1);
  }
  console.log(`OK created: ${inserted.email} → role=${inserted.role} (id=${inserted.id})`);
}

void main();
