/**
 * Replace ad-hoc PostgREST search sanitizers with sanitizeSearchTerm.
 */
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('apps/api/src/services');

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes("replace(/[%_,.()]/g")) continue;

  if (!c.includes('postgrestSafe')) {
    if (c.includes("from '../utils/AppError';")) {
      c = c.replace(
        "from '../utils/AppError';",
        "from '../utils/AppError';\nimport { sanitizeSearchTerm } from '../utils/postgrestSafe';",
      );
    } else {
      c = `import { sanitizeSearchTerm } from '../utils/postgrestSafe';\n${c}`;
    }
  }

  c = c.replace(
    /const safe = ([^;\n]+)\.replace\(\/\[%_,\.\(\)\]\/g, ''\);/g,
    'const safe = sanitizeSearchTerm($1);',
  );

  fs.writeFileSync(p, c);
  console.log('updated', f);
}
