/**
 * Cross-app domain types.
 * Expand as entities (User, Course, Enrollment, Payment, …) are defined.
 */

/** profiles.role values (includes legacy instructor + staff RBAC roles). */
export type UserRole =
  | 'student'
  | 'super_admin'
  | 'admin'
  | 'teacher'
  | 'instructor'
  | 'support';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** Alias kept for paginated list responses (`data` holds CourseListPage, etc.) */
export type ApiPaginatedResponse<T> = ApiSuccessResponse<T>;

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export * from './course';
export * from './batch';
export * from './notifications';
export * from './events';
export * from './profile';
export * from './review';
export * from './feedback';
export * from './bugReport';
export * from './faq';
export * from './supportChat';
export * from './contentReport';
export * from './feedbackDashboard';
export * from './adminOps';
export * from './adminStudents';
export * from './adminTeachers';
export * from './adminAnalytics';
export * from './adminMonitoring';
export * from './backup';
export * from './appVersion';
