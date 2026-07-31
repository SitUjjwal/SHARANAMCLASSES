/**
 * Cross-app domain types.
 * Expand as entities (User, Course, Enrollment, Payment, …) are defined.
 */

export type UserRole = 'student' | 'admin' | 'instructor';

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
