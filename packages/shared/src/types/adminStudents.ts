/**
 * Admin student management shared types.
 */

export type AdminStudent = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  class_level: string;
  medium: string;
  role: string;
  avatar_url: string | null;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
  enrolled_courses: number;
};

export type AdminStudentListPage = {
  items: AdminStudent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminStudentCourse = {
  enrollment_id: string;
  course_id: string;
  course_title: string;
  progress_percent: number;
  enrolled_at: string;
  is_published: boolean;
};

export type AdminStudentTestHistoryItem = {
  attempt_id: string;
  test_id: string;
  test_title: string;
  status: string;
  submitted_at: string | null;
  obtained_marks: number | null;
  total_marks: number | null;
  percentage: number | null;
  is_passed: boolean | null;
};

export type AdminStudentPaymentItem = {
  order_id: string;
  course_title: string;
  amount_paise: number;
  amount_display: string;
  status: string;
  payment_id: string | null;
  created_at: string;
  paid_at: string | null;
};

export type AdminStudentResetPasswordResult = {
  student_id: string;
  email: string;
  temporary_password: string;
  message: string;
};

export type AdminExcelExport = {
  filename: string;
  /** Base64-encoded .xlsx bytes */
  base64: string;
  mime: string;
};
