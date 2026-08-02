/**
 * Content quality report domain types.
 */
export type ContentReportType =
  | 'incorrect_video'
  | 'wrong_pdf'
  | 'broken_link'
  | 'incorrect_question'
  | 'duplicate_content';

export type ContentReportTargetType =
  | 'video'
  | 'pdf'
  | 'note'
  | 'question'
  | 'chapter'
  | 'course'
  | 'other';

export type ContentReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export const CONTENT_REPORT_TYPE_LABELS: Record<ContentReportType, string> = {
  incorrect_video: 'Incorrect Video',
  wrong_pdf: 'Wrong PDF',
  broken_link: 'Broken Link',
  incorrect_question: 'Incorrect Question',
  duplicate_content: 'Duplicate Content',
};

export const CONTENT_REPORT_STATUS_LABELS: Record<ContentReportStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export type ContentReport = {
  id: string;
  ticket_number: string;
  user_id: string;
  report_type: ContentReportType;
  description: string;
  target_type: ContentReportTargetType | null;
  target_id: string | null;
  course_id: string | null;
  chapter_id: string | null;
  target_label: string | null;
  status: ContentReportStatus;
  admin_note: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminContentReport = ContentReport & {
  student_name: string;
  student_email: string | null;
  course_title: string | null;
};

export type SubmitContentReportInput = {
  report_type: ContentReportType;
  description: string;
  target_type?: ContentReportTargetType | null;
  target_id?: string | null;
  course_id?: string | null;
  chapter_id?: string | null;
  target_label?: string | null;
};

export type UpdateContentReportStatusInput = {
  status: ContentReportStatus;
  admin_note?: string | null;
};
