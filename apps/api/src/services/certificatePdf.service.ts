/**
 * Certificate of Completion PDF — landscape template (pdf-lib).
 *
 * Layout:
 *   SHARANAM CLASSES
 *   Certificate of Completion
 *   This certifies that
 *   {Student Name}
 *   has successfully completed
 *   {Course Title}
 *   Issued on
 *   {Date}
 *   Certificate ID
 *   {SCYYYY#####}
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type CertificatePdfInput = {
  studentName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: Date;
};

function formatIssuedDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export async function buildCertificatePdf(
  input: CertificatePdfInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const navy = rgb(0.043, 0.122, 0.227); // #0B1F3A
  const gold = rgb(0.79, 0.64, 0.15);
  const muted = rgb(0.35, 0.42, 0.51);

  // Double border
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: gold,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 38,
    y: 38,
    width: width - 76,
    height: height - 76,
    borderColor: navy,
    borderWidth: 1,
  });

  // Decorative rule under brand
  page.drawLine({
    start: { x: width / 2 - 120, y: height - 108 },
    end: { x: width / 2 + 120, y: height - 108 },
    thickness: 1,
    color: gold,
  });

  const centerX = width / 2;

  const drawCentered = (
    text: string,
    y: number,
    size: number,
    useFont: typeof font,
    color = navy,
  ) => {
    const textWidth = useFont.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: centerX - textWidth / 2,
      y,
      size,
      font: useFont,
      color,
    });
  };

  drawCentered('SHARANAM CLASSES', height - 92, 20, fontBold, gold);
  drawCentered('Certificate of Completion', height - 150, 30, fontBold, navy);
  drawCentered('This certifies that', height - 200, 14, fontItalic, muted);
  drawCentered(input.studentName.trim() || 'Student', height - 250, 28, fontBold, navy);
  drawCentered('has successfully completed', height - 295, 14, font, muted);
  drawCentered(input.courseTitle.trim() || 'Course', height - 340, 22, fontBold, navy);

  drawCentered('Issued on', height - 395, 12, font, muted);
  drawCentered(formatIssuedDate(input.issuedAt), height - 418, 14, fontBold, navy);

  drawCentered('Certificate ID', height - 460, 12, font, muted);
  drawCentered(input.certificateNumber, height - 483, 14, fontBold, navy);

  return doc.save();
}
