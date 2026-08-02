/**
 * Smoke-test Module 7 notification / banner / announcement APIs.
 * Usage: node apps/api/scripts/smoke-module7-apis.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const BASE = process.env.API_BASE_URL || 'http://127.0.0.1:4000';
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;
const adminEmail = (process.env.ADMIN_EMAILS || '').split(',')[0]?.trim().toLowerCase();

if (!url || !serviceKey || !anonKey || !adminEmail) {
  console.error('Missing env for smoke test');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email: adminEmail,
});
if (linkErr) {
  console.error('generateLink failed:', linkErr.message);
  process.exit(1);
}
const tokenHash = linkData?.properties?.hashed_token;
if (!tokenHash) {
  console.error('No hashed_token from generateLink');
  process.exit(1);
}
const { data: otpData, error: otpErr } = await anon.auth.verifyOtp({
  token_hash: tokenHash,
  type: 'email',
});
if (otpErr || !otpData.session?.access_token) {
  console.error('verifyOtp failed:', otpErr?.message || 'no session');
  process.exit(1);
}
const token = otpData.session.access_token;
const userId = otpData.session.user.id;

async function req(label, method, path, body) {
  const started = Date.now();
  let status = 0;
  let json = null;
  let text = '';
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    status = res.status;
    text = await res.text();
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  } catch (e) {
    return {
      label,
      method,
      path,
      ok: false,
      status: 0,
      ms: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  const errObj = json?.error;
  const errorMsg =
    typeof errObj === 'string'
      ? errObj
      : errObj?.message || json?.message || (status >= 400 ? text.slice(0, 220) : undefined);
  return {
    label,
    method,
    path,
    ok: status >= 200 && status < 300,
    status,
    ms: Date.now() - started,
    success: json?.success,
    error: errorMsg,
    id: json?.data?.id,
    count: Array.isArray(json?.data) ? json.data.length : undefined,
  };
}

const results = [];

results.push(
  await req('PUT notifications/:id (expected missing)', 'PUT', '/notifications/00000000-0000-0000-0000-000000000001', {
    title: 'x',
  }),
);
results.push(
  await req(
    'DELETE notifications/:id (expected missing)',
    'DELETE',
    '/notifications/00000000-0000-0000-0000-000000000001',
  ),
);
results.push(
  await req('POST /send-notification (expected missing)', 'POST', '/send-notification', {
    notification_id: '00000000-0000-0000-0000-000000000001',
  }),
);
results.push(
  await req('POST /announcements (admin path is /admin/announcements)', 'POST', '/announcements', {
    title: 'Direct POST announcements',
    body: 'should 404',
  }),
);

const created = await req('POST /notifications', 'POST', '/notifications', {
  title: 'API smoke notification',
  body: 'Created by backend smoke test',
  notification_type: 'general',
  audience_type: 'single_user',
  audience_user_id: userId,
  send: false,
});
results.push(created);

results.push(await req('GET /notifications', 'GET', '/notifications'));

const notifId = created.id;
if (notifId) {
  results.push(await req('GET /notifications/:id', 'GET', `/notifications/${notifId}`));
  results.push(
    await req('POST /notifications/send (canonical send)', 'POST', '/notifications/send', {
      notification_id: notifId,
    }),
  );
}

results.push(await req('GET /banners', 'GET', '/banners'));

const ann = await req('POST /admin/announcements', 'POST', '/admin/announcements', {
  title: 'API smoke announcement',
  body: '<p>Smoke test announcement</p>',
  is_published: true,
  is_pinned: false,
});
results.push(ann);
results.push(await req('GET /announcements', 'GET', '/announcements'));

if (ann.id) {
  results.push(
    await req('DELETE /admin/announcements/:id (cleanup)', 'DELETE', `/admin/announcements/${ann.id}`),
  );
}

const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
console.log(
  JSON.stringify(
    {
      base: BASE,
      adminEmailMasked: adminEmail.replace(/(.{2}).+(@.+)/, '$1***$2'),
      pass,
      fail,
      results,
    },
    null,
    2,
  ),
);
process.exit(fail > 0 && results.some((r) => r.label.startsWith('POST /notifications') && !r.ok) ? 1 : 0);
