/**
 * Student feedback ticket domain types.
 */
export type FeedbackType =
  | 'general'
  | 'course'
  | 'teacher'
  | 'suggestion'
  | 'complaint';

export type FeedbackTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type FeedbackTicket = {
  id: string;
  ticket_number: string;
  user_id: string;
  feedback_type: FeedbackType;
  title: string;
  message: string;
  status: FeedbackTicketStatus;
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

export type AdminFeedbackTicket = FeedbackTicket & {
  student_name: string;
  student_email: string | null;
};

export type SubmitFeedbackTicketInput = {
  feedback_type: FeedbackType;
  title: string;
  message: string;
  course_id?: string | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
};

export type UpdateFeedbackTicketStatusInput = {
  status: FeedbackTicketStatus;
  admin_note?: string | null;
};

/** Student may update title/message only while ticket is open. */
export type UpdateFeedbackTicketContentInput = {
  title?: string;
  message?: string;
};

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  general: 'General Feedback',
  course: 'Course Feedback',
  teacher: 'Teacher Feedback',
  suggestion: 'Suggestion',
  complaint: 'Complaint',
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackTicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};
