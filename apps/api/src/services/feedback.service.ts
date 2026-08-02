/**
 * Student feedback ticket service.
 */
import type {
  AdminFeedbackTicket,
  FeedbackTicket,
  FeedbackTicketStatus,
  FeedbackType,
  SubmitFeedbackTicketInput,
  UpdateFeedbackTicketStatusInput,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

const COLUMNS =
  'id, ticket_number, user_id, feedback_type, title, message, status, course_id, teacher_id, course_title, teacher_name, admin_note, resolved_at, closed_at, created_at, updated_at';

type Row = {
  id: string;
  ticket_number: string;
  user_id: string;
  feedback_type: string;
  title: string;
  message: string;
  status: string;
  course_id: string | null;
  teacher_id: string | null;
  course_title: string | null;
  teacher_name: string | null;
  admin_note: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapTicket(row: Row): FeedbackTicket {
  return {
    id: row.id,
    ticket_number: row.ticket_number,
    user_id: row.user_id,
    feedback_type: row.feedback_type as FeedbackType,
    title: row.title,
    message: row.message,
    status: row.status as FeedbackTicketStatus,
    course_id: row.course_id,
    teacher_id: row.teacher_id,
    course_title: row.course_title,
    teacher_name: row.teacher_name,
    admin_note: row.admin_note,
    resolved_at: row.resolved_at,
    closed_at: row.closed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function nextTicketNumber(): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('next_feedback_ticket_number');
  if (!error && typeof data === 'string' && data.length > 0) {
    return data;
  }

  // Fallback if RPC missing (migration not applied fully)
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-5);
  return `FB${year}${suffix}`;
}

async function resolveCourseTitle(courseId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .maybeSingle();
  if (error) {
    throw new AppError(500, 'COURSE_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }
  return (data.title as string) || 'Course';
}

async function resolveTeacherName(teacherId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', teacherId)
    .maybeSingle();
  if (error) {
    throw new AppError(500, 'TEACHER_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
  }
  return ((data.full_name as string) || '').trim() || 'Teacher';
}

export async function createFeedbackTicket(
  userId: string,
  input: SubmitFeedbackTicketInput,
): Promise<FeedbackTicket> {
  const type = input.feedback_type;
  let courseId: string | null = input.course_id ?? null;
  let teacherId: string | null = input.teacher_id ?? null;
  let courseTitle: string | null = null;
  let teacherName: string | null = input.teacher_name?.trim() || null;

  if (type === 'course') {
    if (!courseId) {
      throw new AppError(400, 'COURSE_REQUIRED', 'Select a course for course feedback');
    }
    courseTitle = await resolveCourseTitle(courseId);
  } else {
    courseId = null;
  }

  if (type === 'teacher') {
    if (teacherId) {
      teacherName = await resolveTeacherName(teacherId);
    } else if (!teacherName) {
      throw new AppError(
        400,
        'TEACHER_REQUIRED',
        'Select or name a teacher for teacher feedback',
      );
    }
  } else {
    teacherId = null;
    teacherName = null;
  }

  const ticketNumber = await nextTicketNumber();
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('student_feedback')
    .insert({
      ticket_number: ticketNumber,
      user_id: userId,
      feedback_type: type,
      title: input.title.trim(),
      message: input.message.trim(),
      status: 'open',
      course_id: courseId,
      teacher_id: teacherId,
      course_title: courseTitle,
      teacher_name: teacherName,
      created_at: now,
      updated_at: now,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'FEEDBACK_CREATE_FAILED', error.message);
  }

  return mapTicket(data as Row);
}

export async function listMyFeedbackTickets(userId: string): Promise<FeedbackTicket[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('student_feedback')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new AppError(500, 'FEEDBACK_FETCH_FAILED', error.message);
  }

  return ((data ?? []) as Row[]).map(mapTicket);
}

export async function getMyFeedbackTicket(
  userId: string,
  feedbackId: string,
): Promise<FeedbackTicket> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('student_feedback')
    .select(COLUMNS)
    .eq('id', feedbackId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'FEEDBACK_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'FEEDBACK_NOT_FOUND', 'Feedback ticket not found');
  }

  return mapTicket(data as Row);
}

export async function listAdminFeedbackTickets(filters?: {
  status?: FeedbackTicketStatus;
  feedback_type?: FeedbackType;
}): Promise<AdminFeedbackTicket[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('student_feedback')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.feedback_type) query = query.eq('feedback_type', filters.feedback_type);

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'FEEDBACK_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as Row[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const nameById = new Map<string, string>();
  const emailById = new Map<string, string>();

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      nameById.set(p.id as string, ((p.full_name as string) || '').trim() || 'Student');
      emailById.set(p.id as string, (p.email as string) || '');
    }
  }

  return rows.map((row) => ({
    ...mapTicket(row),
    student_name: nameById.get(row.user_id) ?? 'Student',
    student_email: emailById.get(row.user_id) ?? null,
  }));
}

export async function updateFeedbackTicketStatus(
  feedbackId: string,
  input: UpdateFeedbackTicketStatusInput,
  adminUserId: string,
): Promise<FeedbackTicket> {
  const supabase = getSupabaseAdmin();
  const { data: current, error: fetchError } = await supabase
    .from('student_feedback')
    .select(COLUMNS)
    .eq('id', feedbackId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'FEEDBACK_FETCH_FAILED', fetchError.message);
  }
  if (!current) {
    throw new AppError(404, 'FEEDBACK_NOT_FOUND', 'Feedback ticket not found');
  }

  const now = new Date().toISOString();
  const status = input.status;
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
    assigned_to: adminUserId,
  };

  if (input.admin_note !== undefined) {
    patch.admin_note = input.admin_note?.trim() || null;
  }

  if (status === 'resolved') {
    patch.resolved_at = now;
    patch.closed_at = null;
  } else if (status === 'closed') {
    patch.closed_at = now;
    if (!(current as Row).resolved_at) {
      patch.resolved_at = now;
    }
  } else {
    patch.resolved_at = null;
    patch.closed_at = null;
  }

  const { data, error } = await supabase
    .from('student_feedback')
    .update(patch)
    .eq('id', feedbackId)
    .select(COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'FEEDBACK_UPDATE_FAILED', error.message);
  }

  return mapTicket(data as Row);
}

export async function updateMyFeedbackTicket(
  userId: string,
  feedbackId: string,
  input: { title?: string; message?: string },
): Promise<FeedbackTicket> {
  const current = await getMyFeedbackTicket(userId, feedbackId);
  if (current.status !== 'open') {
    throw new AppError(
      400,
      'FEEDBACK_NOT_EDITABLE',
      'Only open tickets can be edited',
    );
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.message !== undefined) patch.message = input.message.trim();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('student_feedback')
    .update(patch)
    .eq('id', feedbackId)
    .eq('user_id', userId)
    .select(COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'FEEDBACK_UPDATE_FAILED', error.message);
  }

  return mapTicket(data as Row);
}

export async function deleteMyFeedbackTicket(
  userId: string,
  feedbackId: string,
): Promise<void> {
  const current = await getMyFeedbackTicket(userId, feedbackId);
  if (current.status !== 'open') {
    throw new AppError(
      400,
      'FEEDBACK_NOT_DELETABLE',
      'Only open tickets can be deleted. Contact support if you need help.',
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('student_feedback')
    .delete()
    .eq('id', feedbackId)
    .eq('user_id', userId);

  if (error) {
    throw new AppError(500, 'FEEDBACK_DELETE_FAILED', error.message);
  }
}

export async function deleteAdminFeedbackTicket(feedbackId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error: fetchError } = await supabase
    .from('student_feedback')
    .select('id')
    .eq('id', feedbackId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'FEEDBACK_FETCH_FAILED', fetchError.message);
  }
  if (!data) {
    throw new AppError(404, 'FEEDBACK_NOT_FOUND', 'Feedback ticket not found');
  }

  const { error } = await supabase
    .from('student_feedback')
    .delete()
    .eq('id', feedbackId);

  if (error) {
    throw new AppError(500, 'FEEDBACK_DELETE_FAILED', error.message);
  }
}

export type FeedbackTeacherOption = {
  id: string;
  full_name: string;
};

export async function listFeedbackTeachers(): Promise<FeedbackTeacherOption[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['instructor', 'admin'])
    .order('full_name', { ascending: true });

  if (error) {
    throw new AppError(500, 'TEACHERS_FETCH_FAILED', error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    full_name: ((row.full_name as string) || '').trim() || 'Teacher',
  }));
}
