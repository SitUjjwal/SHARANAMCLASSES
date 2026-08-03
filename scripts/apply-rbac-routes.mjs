/**
 * One-shot: rewrite requireAdmin → requirePermission(module:action) per route file.
 * Run: node scripts/apply-rbac-routes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('apps/api/src/routes');

/** File → default module for admin mutations. */
const MODULE_BY_FILE = {
  'adminDashboard.routes.ts': 'dashboard',
  'adminInsights.routes.ts': 'analytics',
  'adminOps.routes.ts': null, // custom
  'announcement.routes.ts': 'communications',
  'banner.routes.ts': 'communications',
  'bugReport.routes.ts': 'feedback',
  'category.routes.ts': 'courses',
  'certificate.routes.ts': 'communications',
  'contentReport.routes.ts': 'feedback',
  'course.routes.ts': 'courses',
  'faq.routes.ts': 'feedback',
  'feedback.routes.ts': 'feedback',
  'feedbackDashboard.routes.ts': 'feedback',
  'liveClass.routes.ts': 'courses',
  'note.routes.ts': 'courses',
  'notification.routes.ts': 'communications',
  'payment.routes.ts': 'payments',
  'pdf.routes.ts': 'courses',
  'question.routes.ts': 'tests',
  'reminder.routes.ts': 'communications',
  'review.routes.ts': 'feedback',
  'studentAdmin.routes.ts': 'students',
  'supportChat.routes.ts': 'feedback',
  'teacher.routes.ts': 'teachers',
  'test.routes.ts': 'tests',
  'video.routes.ts': 'courses',
};

function actionFromLine(line) {
  const m = line.match(/\.(get|post|put|patch|delete)\s*\(/i);
  if (!m) return null;
  const method = m[1].toLowerCase();
  if (method === 'get') return 'read';
  if (method === 'post') return 'create';
  if (method === 'put' || method === 'patch') return 'update';
  if (method === 'delete') return 'delete';
  return 'read';
}

function transformAdminOps(src) {
  let out = src.replace(
    /import \{ requireAdmin \} from '\.\.\/middlewares\/requireAdmin';/,
    "import { requirePermission } from '../middlewares/requirePermission';",
  );

  const map = [
    ['/admin/revenue/overview', 'payments:read'],
    ['/admin/reports/:reportKey/export', 'reports:create'],
    ['/admin/reports', 'reports:read'],
    ['/admin/activity-logs/export', 'reports:create'],
    ['/admin/activity-logs', 'settings:read'],
    ['/admin/settings', 'settings:read'], // GET — PUT handled below
  ];

  // Replace each requireAdmin block by inspecting nearby path — simpler: line-based
  const lines = out.split('\n');
  const result = [];
  let pendingPath = null;
  let pendingMethod = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const routeMatch = line.match(/adminOpsRouter\.(get|put|post|patch|delete)\(\s*$/);
    const inlineMatch = line.match(
      /adminOpsRouter\.(get|put|post|patch|delete)\(\s*['`]([^'`]+)['`]/,
    );

    if (routeMatch) {
      pendingMethod = routeMatch[1].toLowerCase();
      pendingPath = null;
      result.push(line);
      continue;
    }

    if (inlineMatch) {
      pendingMethod = inlineMatch[1].toLowerCase();
      pendingPath = inlineMatch[2];
    }

    const pathOnly = line.match(/^\s*['`]([^'`]+)['`]\s*,?\s*$/);
    if (pendingMethod && !pendingPath && pathOnly) {
      pendingPath = pathOnly[1];
    }

    if (line.includes('requireAdmin')) {
      let perm = 'settings:read';
      if (pendingPath?.includes('revenue')) perm = 'payments:read';
      else if (pendingPath?.includes('reports') && pendingPath?.includes('export'))
        perm = 'reports:create';
      else if (pendingPath?.includes('reports')) perm = 'reports:read';
      else if (pendingPath?.includes('activity-logs') && pendingPath?.includes('export'))
        perm = 'reports:create';
      else if (pendingPath?.includes('activity-logs')) perm = 'settings:read';
      else if (pendingPath?.includes('settings') && pendingMethod === 'put')
        perm = 'settings:update';
      else if (pendingPath?.includes('settings')) perm = 'settings:read';

      result.push(line.replace('requireAdmin', `requirePermission('${perm}')`));
      pendingPath = null;
      pendingMethod = null;
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

function transformGeneric(src, module) {
  let out = src.replace(
    /import \{ requireAdmin \} from '\.\.\/middlewares\/requireAdmin';/,
    "import { requirePermission } from '../middlewares/requirePermission';",
  );

  // Also handle multi-import if any
  out = out.replace(
    /import \{ requireAdmin \} from "\.\.\/middlewares\/requireAdmin";/,
    'import { requirePermission } from "../middlewares/requirePermission";',
  );

  const lines = out.split('\n');
  const result = [];
  let lastAction = 'read';

  for (const line of lines) {
    const act = actionFromLine(line);
    if (act) lastAction = act;

    if (line.includes('requireAdmin')) {
      // Prefer method from same line if present
      const sameLineAct = actionFromLine(line) ?? lastAction;
      const perm = `${module}:${sameLineAct}`;
      result.push(line.replace(/requireAdmin/g, `requirePermission('${perm}')`));
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

for (const [file, module] of Object.entries(MODULE_BY_FILE)) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.warn('missing', file);
    continue;
  }
  const src = fs.readFileSync(full, 'utf8');
  if (!src.includes('requireAdmin')) continue;

  const next =
    file === 'adminOps.routes.ts' ? transformAdminOps(src) : transformGeneric(src, module);

  fs.writeFileSync(full, next);
  console.log('updated', file);
}

console.log('done');
