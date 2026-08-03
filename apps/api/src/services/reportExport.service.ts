/**
 * Admin Reports Module — generate Student / Payment / Revenue / Course /
 * Attendance / Teacher reports and export as CSV, Excel, or PDF.
 */
import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type {
  AdminReportFileExport,
  AdminReportFormat,
  AdminReportSummary,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type ReportKey =
  | 'students'
  | 'payments'
  | 'revenue'
  | 'courses'
  | 'attendance'
  | 'teachers';

type ReportTable = {
  key: ReportKey;
  title: string;
  columns: string[];
  rows: string[][];
};

const REPORT_META: Record<
  ReportKey,
  { title: string; description: string; href: string | null }
> = {
  students: {
    title: 'Student Report',
    description: 'All students — class, medium, status, enrollments',
    href: '/students',
  },
  payments: {
    title: 'Payment Report',
    description: 'Payment orders — amount, status, student, course',
    href: '/payments',
  },
  revenue: {
    title: 'Revenue Report',
    description: 'Paid revenue by day with order counts',
    href: '/revenue',
  },
  courses: {
    title: 'Course Report',
    description: 'Courses with teacher, publish state, enrollments',
    href: '/courses',
  },
  attendance: {
    title: 'Attendance Report',
    description: 'Live class attendance joins',
    href: '/analytics',
  },
  teachers: {
    title: 'Teacher Report',
    description: 'Instructors with assigned courses and live classes',
    href: '/teachers',
  },
};

const FORMATS: AdminReportFormat[] = ['csv', 'xlsx', 'pdf'];

const MIME: Record<AdminReportFormat, string> = {
  csv: 'text/csv;charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatInrFromPaise(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

/** Catalog for GET /admin/reports */
export function listReportCatalog(): AdminReportSummary[] {
  return (Object.keys(REPORT_META) as ReportKey[]).map((key) => ({
    key,
    title: REPORT_META[key].title,
    description: REPORT_META[key].description,
    href: REPORT_META[key].href,
    export_path: `/admin/reports/${key}/export`,
    formats: [...FORMATS],
  }));
}

async function buildStudentReport(): Promise<ReportTable> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, phone_number, class_level, medium, is_suspended, created_at',
    )
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error && !/is_suspended/i.test(error.message)) {
    throw new AppError(500, 'REPORT_STUDENTS_FAILED', error.message);
  }

  let rows = (data ?? []) as Record<string, unknown>[];
  if (error && /is_suspended/i.test(error.message)) {
    const fallback = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, class_level, medium, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(2000);
    if (fallback.error) {
      throw new AppError(500, 'REPORT_STUDENTS_FAILED', fallback.error.message);
    }
    rows = (fallback.data ?? []) as Record<string, unknown>[];
  }

  const ids = rows.map((r) => r.id as string);
  const enrollMap = new Map<string, number>();
  if (ids.length) {
    const { data: enrolls } = await supabase
      .from('enrollments')
      .select('user_id')
      .in('user_id', ids.slice(0, 500));
    for (const e of enrolls ?? []) {
      const uid = e.user_id as string;
      enrollMap.set(uid, (enrollMap.get(uid) ?? 0) + 1);
    }
  }

  return {
    key: 'students',
    title: REPORT_META.students.title,
    columns: [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Class',
      'Medium',
      'Status',
      'Enrollments',
      'Joined',
    ],
    rows: rows.map((r) => [
      String(r.id ?? ''),
      String(r.full_name ?? ''),
      String(r.email ?? ''),
      String(r.phone_number ?? ''),
      String(r.class_level ?? ''),
      String(r.medium ?? ''),
      r.is_suspended ? 'Suspended' : 'Active',
      String(enrollMap.get(r.id as string) ?? 0),
      String(r.created_at ?? ''),
    ]),
  };
}

async function buildPaymentReport(): Promise<ReportTable> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('payment_orders')
    .select(
      'id, user_id, course_id, amount_paise, status, razorpay_payment_id, created_at, paid_at',
    )
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) throw new AppError(500, 'REPORT_PAYMENTS_FAILED', error.message);

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id as string))];
  const courseIds = [
    ...new Set(
      rows
        .map((r) => r.course_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const emailById = new Map<string, string>();
  const titleByCourse = new Map<string, string>();

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds.slice(0, 500));
    for (const p of profiles ?? []) {
      emailById.set(p.id as string, (p.email as string) || '');
    }
  }
  if (courseIds.length) {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);
    for (const c of courses ?? []) {
      titleByCourse.set(c.id as string, (c.title as string) || 'Course');
    }
  }

  return {
    key: 'payments',
    title: REPORT_META.payments.title,
    columns: [
      'Order ID',
      'Student Email',
      'Course',
      'Amount',
      'Status',
      'Payment ID',
      'Created',
      'Paid At',
    ],
    rows: rows.map((r) => [
      String(r.id ?? ''),
      emailById.get(r.user_id as string) ?? '',
      r.course_id ? titleByCourse.get(r.course_id as string) ?? '' : '',
      formatInrFromPaise(Number(r.amount_paise ?? 0)),
      String(r.status ?? ''),
      String(r.razorpay_payment_id ?? ''),
      String(r.created_at ?? ''),
      String(r.paid_at ?? ''),
    ]),
  };
}

async function buildRevenueReport(): Promise<ReportTable> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('payment_orders')
    .select('amount_paise, created_at, paid_at')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(5000);

  if (error) throw new AppError(500, 'REPORT_REVENUE_FAILED', error.message);

  const byDay = new Map<string, { paise: number; orders: number }>();
  for (const row of data ?? []) {
    const day = String(row.paid_at ?? row.created_at ?? '').slice(0, 10);
    if (!day) continue;
    const bucket = byDay.get(day) ?? { paise: 0, orders: 0 };
    bucket.paise += Number(row.amount_paise ?? 0);
    bucket.orders += 1;
    byDay.set(day, bucket);
  }

  const days = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return {
    key: 'revenue',
    title: REPORT_META.revenue.title,
    columns: ['Date', 'Orders', 'Revenue'],
    rows: days.map(([day, b]) => [
      day,
      String(b.orders),
      formatInrFromPaise(b.paise),
    ]),
  };
}

async function buildCourseReport(): Promise<ReportTable> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, is_published, teacher_id, teacher_name, created_at')
    .order('title', { ascending: true })
    .limit(1000);

  if (error) throw new AppError(500, 'REPORT_COURSES_FAILED', error.message);

  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  const enrollMap = new Map<string, number>();
  if (ids.length) {
    const { data: enrolls } = await supabase
      .from('enrollments')
      .select('course_id')
      .in('course_id', ids);
    for (const e of enrolls ?? []) {
      const cid = e.course_id as string;
      enrollMap.set(cid, (enrollMap.get(cid) ?? 0) + 1);
    }
  }

  return {
    key: 'courses',
    title: REPORT_META.courses.title,
    columns: [
      'ID',
      'Title',
      'Published',
      'Teacher',
      'Enrollments',
      'Created',
    ],
    rows: rows.map((r) => [
      String(r.id ?? ''),
      String(r.title ?? ''),
      r.is_published ? 'Yes' : 'No',
      String(r.teacher_name ?? ''),
      String(enrollMap.get(r.id as string) ?? 0),
      String(r.created_at ?? ''),
    ]),
  };
}

async function buildAttendanceReport(): Promise<ReportTable> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('live_class_attendance')
    .select('id, live_class_id, user_id, joined_at, left_at')
    .order('joined_at', { ascending: false })
    .limit(2000);

  if (error) {
    if (/does not exist|live_class_attendance/i.test(error.message)) {
      return {
        key: 'attendance',
        title: REPORT_META.attendance.title,
        columns: [
          'Attendance ID',
          'Live Class',
          'Student Email',
          'Joined At',
          'Left At',
        ],
        rows: [],
      };
    }
    throw new AppError(500, 'REPORT_ATTENDANCE_FAILED', error.message);
  }

  const rows = data ?? [];
  const classIds = [...new Set(rows.map((r) => r.live_class_id as string))];
  const userIds = [...new Set(rows.map((r) => r.user_id as string))];

  const classTitle = new Map<string, string>();
  const emailById = new Map<string, string>();

  if (classIds.length) {
    const { data: classes } = await supabase
      .from('live_classes')
      .select('id, title')
      .in('id', classIds);
    for (const c of classes ?? []) {
      classTitle.set(c.id as string, (c.title as string) || 'Live class');
    }
  }
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds.slice(0, 500));
    for (const p of profiles ?? []) {
      emailById.set(p.id as string, (p.email as string) || '');
    }
  }

  return {
    key: 'attendance',
    title: REPORT_META.attendance.title,
    columns: [
      'Attendance ID',
      'Live Class',
      'Student Email',
      'Joined At',
      'Left At',
    ],
    rows: rows.map((r) => [
      String(r.id ?? ''),
      classTitle.get(r.live_class_id as string) ?? '',
      emailById.get(r.user_id as string) ?? '',
      String(r.joined_at ?? ''),
      String(r.left_at ?? ''),
    ]),
  };
}

async function buildTeacherReport(): Promise<ReportTable> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone_number, role, created_at')
    .in('role', ['instructor', 'admin'])
    .order('full_name', { ascending: true })
    .limit(500);

  if (error) throw new AppError(500, 'REPORT_TEACHERS_FAILED', error.message);

  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  const courseMap = new Map<string, number>();
  const liveMap = new Map<string, number>();

  if (ids.length) {
    const { data: courses } = await supabase
      .from('courses')
      .select('teacher_id')
      .in('teacher_id', ids);
    for (const c of courses ?? []) {
      const tid = c.teacher_id as string;
      courseMap.set(tid, (courseMap.get(tid) ?? 0) + 1);
    }
    const { data: lives } = await supabase
      .from('live_classes')
      .select('teacher_id')
      .in('teacher_id', ids);
    for (const l of lives ?? []) {
      const tid = l.teacher_id as string | null;
      if (!tid) continue;
      liveMap.set(tid, (liveMap.get(tid) ?? 0) + 1);
    }
  }

  return {
    key: 'teachers',
    title: REPORT_META.teachers.title,
    columns: [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Role',
      'Courses',
      'Live Classes',
      'Joined',
    ],
    rows: rows.map((r) => [
      String(r.id ?? ''),
      String(r.full_name ?? ''),
      String(r.email ?? ''),
      String(r.phone_number ?? ''),
      String(r.role ?? ''),
      String(courseMap.get(r.id as string) ?? 0),
      String(liveMap.get(r.id as string) ?? 0),
      String(r.created_at ?? ''),
    ]),
  };
}

async function buildReportTable(key: ReportKey): Promise<ReportTable> {
  switch (key) {
    case 'students':
      return buildStudentReport();
    case 'payments':
      return buildPaymentReport();
    case 'revenue':
      return buildRevenueReport();
    case 'courses':
      return buildCourseReport();
    case 'attendance':
      return buildAttendanceReport();
    case 'teachers':
      return buildTeacherReport();
    default:
      throw new AppError(404, 'REPORT_NOT_FOUND', `Unknown report: ${key}`);
  }
}

function toCsv(table: ReportTable): string {
  const lines = [
    table.columns.map(escapeCsvCell).join(','),
    ...table.rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  return lines.join('\n');
}

async function toExcel(table: ReportTable): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SHARANAM CLASSES';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(table.title.slice(0, 31));
  sheet.addRow(table.columns);
  sheet.getRow(1).font = { bold: true };
  for (const row of table.rows) {
    sheet.addRow(row);
  }
  sheet.columns.forEach((col) => {
    col.width = 18;
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function toPdf(table: ReportTable): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.043, 0.122, 0.227);
  const muted = rgb(0.4, 0.45, 0.5);

  const pageWidth = 842; // landscape A4
  const pageHeight = 595;
  const margin = 36;
  const maxRowsPerPage = 22;
  const rows = table.rows.slice(0, 500);
  const colCount = Math.max(1, table.columns.length);
  const usableWidth = pageWidth - margin * 2;
  const colWidth = usableWidth / colCount;
  const rowHeight = 18;

  const pagesNeeded = Math.max(1, Math.ceil(rows.length / maxRowsPerPage));

  for (let p = 0; p < pagesNeeded; p += 1) {
    const page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    page.drawText('SHARANAM CLASSES', {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: navy,
    });
    y -= 16;
    page.drawText(table.title, {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: navy,
    });
    y -= 14;
    page.drawText(
      `Generated ${new Date().toLocaleString('en-IN')} · Page ${p + 1}/${pagesNeeded}`,
      {
        x: margin,
        y,
        size: 9,
        font,
        color: muted,
      },
    );
    y -= 20;

    // Header row
    table.columns.forEach((col, i) => {
      page.drawText(col.slice(0, 18), {
        x: margin + i * colWidth,
        y,
        size: 8,
        font: fontBold,
        color: navy,
        maxWidth: colWidth - 4,
      });
    });
    y -= 4;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.8,
      color: navy,
    });
    y -= 14;

    const slice = rows.slice(p * maxRowsPerPage, (p + 1) * maxRowsPerPage);
    for (const row of slice) {
      row.forEach((cell, i) => {
        page.drawText(String(cell).slice(0, 22), {
          x: margin + i * colWidth,
          y,
          size: 7.5,
          font,
          color: navy,
          maxWidth: colWidth - 4,
        });
      });
      y -= rowHeight;
      if (y < margin + 20) break;
    }
  }

  return doc.save();
}

function parseReportKey(raw: string): ReportKey {
  if (
    raw === 'students' ||
    raw === 'payments' ||
    raw === 'revenue' ||
    raw === 'courses' ||
    raw === 'attendance' ||
    raw === 'teachers'
  ) {
    return raw;
  }
  throw new AppError(404, 'REPORT_NOT_FOUND', `Unknown report: ${raw}`);
}

function parseFormat(raw: string | undefined): AdminReportFormat {
  if (raw === 'csv' || raw === 'xlsx' || raw === 'pdf') return raw;
  throw new AppError(400, 'INVALID_FORMAT', 'format must be csv, xlsx, or pdf');
}

/** GET /admin/reports/:key/export?format=csv|xlsx|pdf */
export async function exportAdminReport(
  keyRaw: string,
  formatRaw?: string,
): Promise<AdminReportFileExport> {
  const key = parseReportKey(keyRaw);
  const format = parseFormat(formatRaw ?? 'csv');
  const table = await buildReportTable(key);
  const base = `${key}-report-${stamp()}`;

  if (format === 'csv') {
    const csv = toCsv(table);
    return {
      key,
      title: table.title,
      format,
      filename: `${base}.csv`,
      base64: Buffer.from(csv, 'utf8').toString('base64'),
      mime: MIME.csv,
      row_count: table.rows.length,
    };
  }

  if (format === 'xlsx') {
    const buffer = await toExcel(table);
    return {
      key,
      title: table.title,
      format,
      filename: `${base}.xlsx`,
      base64: buffer.toString('base64'),
      mime: MIME.xlsx,
      row_count: table.rows.length,
    };
  }

  const pdfBytes = await toPdf(table);
  return {
    key,
    title: table.title,
    format,
    filename: `${base}.pdf`,
    base64: Buffer.from(pdfBytes).toString('base64'),
    mime: MIME.pdf,
    row_count: table.rows.length,
  };
}
