/**
 * Certificates — request on course completion, admin approve → PDF → R2.
 */
import type { AdminCertificate, Certificate, CertificateStatus } from '@sharanam/shared';

import { env, isR2Configured } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import { putR2Object } from '../integrations/r2/client';
import { AppError } from '../utils/AppError';
import { buildCertificatePdf } from './certificatePdf.service';

const COLUMNS =
  'id, user_id, course_id, title, description, certificate_number, status, student_name, certificate_url, storage_key, issued_at, requested_at, approved_at, rejected_reason, created_at';

function mapRow(row: Record<string, unknown>, courseTitle?: string | null): Certificate {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    course_id: (row.course_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string) ?? '',
    certificate_number: (row.certificate_number as string | null) ?? null,
    status: row.status as CertificateStatus,
    student_name: (row.student_name as string) ?? '',
    certificate_url: (row.certificate_url as string | null) ?? null,
    storage_key: (row.storage_key as string | null) ?? null,
    issued_at: (row.issued_at as string | null) ?? null,
    requested_at: (row.requested_at as string) ?? (row.created_at as string),
    approved_at: (row.approved_at as string | null) ?? null,
    rejected_reason: (row.rejected_reason as string | null) ?? null,
    created_at: row.created_at as string,
    course_title: courseTitle ?? null,
  };
}

function courseTitleFromJoin(raw: unknown): string | null {
  if (!raw) return null;
  const course = Array.isArray(raw) ? raw[0] : raw;
  return (course as { title?: string } | null)?.title ?? null;
}

/**
 * Certificate IDs: SC + year + 5-digit sequence → SC202600001
 */
async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SC${year}`;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('certificates')
    .select('certificate_number')
    .like('certificate_number', `${prefix}%`)
    .order('certificate_number', { ascending: false })
    .limit(50);

  if (error) {
    throw new AppError(500, 'CERTIFICATE_NUMBER_FAILED', error.message);
  }

  let next = 1;
  for (const row of data ?? []) {
    const value = row.certificate_number as string | null;
    if (!value?.startsWith(prefix)) continue;
    const suffix = Number.parseInt(value.slice(prefix.length), 10);
    if (Number.isFinite(suffix) && suffix >= next) {
      next = suffix + 1;
    }
  }

  return `${prefix}${String(next).padStart(5, '0')}`;
}

async function assertCourseCompleted(userId: string, courseId: string): Promise<{
  progress_percent: number;
  course_title: string;
  student_name: string;
}> {
  const supabase = getSupabaseAdmin();

  const [{ data: enrollment, error: enrollError }, { data: course }, { data: profile }] =
    await Promise.all([
      supabase
        .from('enrollments')
        .select('progress_percent')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle(),
      supabase.from('courses').select('id, title, is_published').eq('id', courseId).maybeSingle(),
      supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    ]);

  if (enrollError) {
    throw new AppError(500, 'ENROLLMENT_LOOKUP_FAILED', enrollError.message);
  }
  if (!enrollment) {
    throw new AppError(403, 'NOT_ENROLLED', 'You are not enrolled in this course');
  }
  if (!course || !course.is_published) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const progress = Number(enrollment.progress_percent) || 0;
  if (progress < 100) {
    throw new AppError(
      400,
      'COURSE_NOT_COMPLETE',
      'Complete the course (100% progress) before requesting a certificate',
    );
  }

  return {
    progress_percent: progress,
    course_title: course.title as string,
    student_name: profile?.full_name?.trim() || 'Student',
  };
}

/**
 * requestCertificateAfterCompletion
 * Creates pending_approval row after course reaches 100% (idempotent).
 */
export async function requestCertificateAfterCompletion(
  userId: string,
  courseId: string,
): Promise<Certificate> {
  const meta = await assertCourseCompleted(userId, courseId);
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('certificates')
    .select(COLUMNS)
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    const status = existing.status as CertificateStatus;
    if (status === 'issued' || status === 'pending_approval') {
      return mapRow(existing as Record<string, unknown>, meta.course_title);
    }
    // rejected → allow re-request
  }

  const now = new Date().toISOString();
  const title = `Certificate — ${meta.course_title}`;
  const description = `Certificate of completion for ${meta.course_title}`;

  if (existing?.status === 'rejected') {
    const { data, error } = await supabase
      .from('certificates')
      .update({
        status: 'pending_approval',
        student_name: meta.student_name,
        title,
        description,
        rejected_reason: null,
        requested_at: now,
        approved_at: null,
        approved_by: null,
        certificate_number: null,
        certificate_url: null,
        storage_key: null,
        issued_at: null,
      })
      .eq('id', existing.id)
      .select(COLUMNS)
      .maybeSingle();

    if (error || !data) {
      throw new AppError(500, 'CERTIFICATE_REQUEST_FAILED', error?.message ?? 'Request failed');
    }
    return mapRow(data as Record<string, unknown>, meta.course_title);
  }

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      user_id: userId,
      course_id: courseId,
      title,
      description,
      student_name: meta.student_name,
      status: 'pending_approval',
      requested_at: now,
    })
    .select(COLUMNS)
    .maybeSingle();

  if (error || !data) {
    // Unique race — return existing
    if (error?.code === '23505') {
      const { data: again } = await supabase
        .from('certificates')
        .select(COLUMNS)
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
      if (again) return mapRow(again as Record<string, unknown>, meta.course_title);
    }
    throw new AppError(500, 'CERTIFICATE_REQUEST_FAILED', error?.message ?? 'Request failed');
  }

  return mapRow(data as Record<string, unknown>, meta.course_title);
}

/**
 * Called when enrollment hits 100% — best-effort request (no throw to callers).
 */
export async function maybeRequestCertificateOnCompletion(
  userId: string,
  courseId: string,
  progressPercent: number,
): Promise<void> {
  if (progressPercent < 100) return;
  try {
    await requestCertificateAfterCompletion(userId, courseId);
  } catch (err) {
    console.warn('[certificates] auto-request skipped', err);
  }
}

export async function listCertificatesForUser(userId: string): Promise<Certificate[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('certificates')
    .select(`${COLUMNS}, courses(title)`)
    .eq('user_id', userId)
    .in('status', ['issued', 'pending_approval'])
    .order('requested_at', { ascending: false });

  if (error) {
    throw new AppError(500, 'CERTIFICATES_LIST_FAILED', error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return mapRow(r, courseTitleFromJoin(r.courses));
  });
}

export async function getCertificateForUser(
  userId: string,
  certificateId: string,
): Promise<Certificate> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('certificates')
    .select(`${COLUMNS}, courses(title)`)
    .eq('id', certificateId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CERTIFICATE_LOAD_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');
  }

  const r = data as Record<string, unknown>;
  return mapRow(r, courseTitleFromJoin(r.courses));
}

export async function listAdminCertificates(filters?: {
  status?: CertificateStatus;
}): Promise<AdminCertificate[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('certificates')
    .select(`${COLUMNS}, courses(title)`)
    .order('requested_at', { ascending: false })
    .limit(100);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'ADMIN_CERTIFICATES_FAILED', error.message);
  }

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id as string))];
  const emailByUser = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      if (p.email) emailByUser.set(p.id as string, p.email as string);
    }
  }

  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      ...mapRow(r, courseTitleFromJoin(r.courses)),
      student_email: emailByUser.get(r.user_id as string) ?? null,
    };
  });
}

/**
 * approveCertificate
 * Admin approval → assign number → generate PDF → upload R2 → status issued.
 */
export async function approveCertificate(
  certificateId: string,
  adminUserId: string,
): Promise<Certificate> {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from('certificates')
    .select(`${COLUMNS}, courses(title)`)
    .eq('id', certificateId)
    .maybeSingle();

  if (error) throw new AppError(500, 'CERTIFICATE_LOAD_FAILED', error.message);
  if (!row) throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');

  const current = row as Record<string, unknown>;
  if ((current.status as string) === 'issued') {
    return mapRow(current, courseTitleFromJoin(current.courses));
  }
  if ((current.status as string) === 'rejected') {
    throw new AppError(400, 'CERTIFICATE_REJECTED', 'Re-request the certificate first');
  }

  const courseTitle =
    courseTitleFromJoin(current.courses) ||
    String(current.title).replace(/^Certificate — /, '');
  const studentName = (current.student_name as string) || 'Student';
  const certificateNumber = await generateCertificateNumber();
  const issuedAt = new Date();

  const pdfBytes = await buildCertificatePdf({
    studentName,
    courseTitle,
    certificateNumber,
    issuedAt,
  });

  const storageKey = `certificates/${current.user_id}/${certificateId}.pdf`;
  let certificateUrl: string;

  if (isR2Configured()) {
    const uploaded = await putR2Object({
      key: storageKey,
      body: Buffer.from(pdfBytes),
      contentType: 'application/pdf',
      cacheControl: 'public, max-age=86400',
    });
    certificateUrl = uploaded.file_url;
  } else if (env.NODE_ENV === 'production') {
    throw new AppError(503, 'R2_NOT_CONFIGURED', 'Cloudflare R2 is required for certificate PDFs');
  } else {
    const { error: upError } = await supabase.storage
      .from('course-thumbnails')
      .upload(storageKey, Buffer.from(pdfBytes), {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (upError) {
      throw new AppError(500, 'CERTIFICATE_UPLOAD_FAILED', upError.message);
    }
    const { data: pub } = supabase.storage.from('course-thumbnails').getPublicUrl(storageKey);
    certificateUrl = pub.publicUrl;
  }

  const { data: updated, error: updateError } = await supabase
    .from('certificates')
    .update({
      status: 'issued',
      certificate_number: certificateNumber,
      certificate_url: certificateUrl,
      storage_key: isR2Configured() ? storageKey : `supabase:${storageKey}`,
      issued_at: issuedAt.toISOString(),
      approved_at: issuedAt.toISOString(),
      approved_by: adminUserId,
      rejected_reason: null,
    })
    .eq('id', certificateId)
    .select(COLUMNS)
    .maybeSingle();

  if (updateError || !updated) {
    throw new AppError(
      500,
      'CERTIFICATE_APPROVE_FAILED',
      updateError?.message ?? 'Approve failed',
    );
  }

  return mapRow(updated as Record<string, unknown>, courseTitle);
}

export async function rejectCertificate(
  certificateId: string,
  adminUserId: string,
  reason?: string,
): Promise<Certificate> {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from('certificates')
    .select(COLUMNS)
    .eq('id', certificateId)
    .maybeSingle();

  if (error) throw new AppError(500, 'CERTIFICATE_LOAD_FAILED', error.message);
  if (!row) throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');
  if ((row.status as string) === 'issued') {
    throw new AppError(400, 'CERTIFICATE_ALREADY_ISSUED', 'Cannot reject an issued certificate');
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('certificates')
    .update({
      status: 'rejected',
      rejected_reason: reason?.trim() || 'Rejected by admin',
      approved_by: adminUserId,
      approved_at: now,
    })
    .eq('id', certificateId)
    .select(COLUMNS)
    .maybeSingle();

  if (updateError || !updated) {
    throw new AppError(
      500,
      'CERTIFICATE_REJECT_FAILED',
      updateError?.message ?? 'Reject failed',
    );
  }

  return mapRow(updated as Record<string, unknown>);
}

/**
 * updateAdminCertificate
 * Edit student name / course label / description.
 * Issued certs regenerate the PDF (keeps same Certificate ID + issue date).
 */
export async function updateAdminCertificate(
  certificateId: string,
  input: {
    student_name?: string;
    course_title?: string;
    description?: string;
    regenerate_pdf?: boolean;
  },
): Promise<Certificate> {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from('certificates')
    .select(`${COLUMNS}, courses(title)`)
    .eq('id', certificateId)
    .maybeSingle();

  if (error) throw new AppError(500, 'CERTIFICATE_LOAD_FAILED', error.message);
  if (!row) throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');

  const current = row as Record<string, unknown>;
  const joinedTitle = courseTitleFromJoin(current.courses);
  const nextStudentName =
    input.student_name !== undefined
      ? input.student_name.trim() || 'Student'
      : ((current.student_name as string) || 'Student');

  const nextCourseTitle =
    input.course_title !== undefined
      ? input.course_title.trim() || 'Course'
      : joinedTitle ||
        String(current.title ?? '')
          .replace(/^Certificate — /, '')
          .trim() ||
        'Course';

  const nextTitle =
    input.course_title !== undefined
      ? `Certificate — ${nextCourseTitle}`
      : (current.title as string);

  const nextDescription =
    input.description !== undefined
      ? input.description.trim()
      : ((current.description as string) ?? '');

  const status = current.status as CertificateStatus;
  const shouldRegenerate =
    status === 'issued' &&
    Boolean(current.certificate_number) &&
    input.regenerate_pdf !== false;

  const patch: Record<string, unknown> = {
    student_name: nextStudentName,
    title: nextTitle,
    description: nextDescription,
  };

  if (shouldRegenerate) {
    const certificateNumber = current.certificate_number as string;
    const issuedAt = current.issued_at
      ? new Date(current.issued_at as string)
      : new Date();

    const pdfBytes = await buildCertificatePdf({
      studentName: nextStudentName,
      courseTitle: nextCourseTitle,
      certificateNumber,
      issuedAt,
    });

    const storageKey = `certificates/${current.user_id}/${certificateId}.pdf`;
    let certificateUrl: string;

    if (isR2Configured()) {
      const uploaded = await putR2Object({
        key: storageKey,
        body: Buffer.from(pdfBytes),
        contentType: 'application/pdf',
        cacheControl: 'public, max-age=86400',
      });
      certificateUrl = uploaded.file_url;
    } else if (env.NODE_ENV === 'production') {
      throw new AppError(503, 'R2_NOT_CONFIGURED', 'Cloudflare R2 is required for certificate PDFs');
    } else {
      const { error: upError } = await supabase.storage
        .from('course-thumbnails')
        .upload(storageKey, Buffer.from(pdfBytes), {
          contentType: 'application/pdf',
          upsert: true,
        });
      if (upError) {
        throw new AppError(500, 'CERTIFICATE_UPLOAD_FAILED', upError.message);
      }
      const { data: pub } = supabase.storage.from('course-thumbnails').getPublicUrl(storageKey);
      certificateUrl = `${pub.publicUrl}?v=${Date.now()}`;
    }

    patch.certificate_url = certificateUrl;
    patch.storage_key = isR2Configured() ? storageKey : `supabase:${storageKey}`;
  }

  const { data: updated, error: updateError } = await supabase
    .from('certificates')
    .update(patch)
    .eq('id', certificateId)
    .select(COLUMNS)
    .maybeSingle();

  if (updateError || !updated) {
    throw new AppError(
      500,
      'CERTIFICATE_UPDATE_FAILED',
      updateError?.message ?? 'Update failed',
    );
  }

  return mapRow(updated as Record<string, unknown>, nextCourseTitle);
}
