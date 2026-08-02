import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCertificatePdf } from '../src/services/certificatePdf.service';

async function main() {
  const bytes = await buildCertificatePdf({
    studentName: 'Ujjwal Sharan',
    courseTitle: 'Class 10 Mathematics',
    certificateNumber: 'SC202600001',
    issuedAt: new Date(2026, 6, 31, 12, 0, 0),
  });
  const out = resolve(__dirname, 'certificate-sample.pdf');
  writeFileSync(out, bytes);
  console.log('OK', out, bytes.byteLength);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
