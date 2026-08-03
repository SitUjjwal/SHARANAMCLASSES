/**
 * Admin teacher directory API.
 */
import type {
  AdminTeacher,
  AdminTeacherCourse,
  AdminTeacherDetail,
  AdminTeacherLiveClass,
  AdminTeacherStats,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

/** Alias for list rows */
export type TeacherRecord = AdminTeacher;

export type CreateTeacherPayload = {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  promote_if_exists?: boolean;
};

export type UpdateTeacherPayload = {
  full_name?: string;
  phone_number?: string;
};

export function fetchAdminTeachers() {
  return apiRequest<AdminTeacher[]>('/teachers');
}

export function fetchAdminTeacherDetail(teacherId: string) {
  return apiRequest<AdminTeacherDetail>(`/teachers/${teacherId}`);
}

export function fetchAdminTeacherStats(teacherId: string) {
  return apiRequest<AdminTeacherStats>(`/admin/teachers/${teacherId}/stats`);
}

export function createAdminTeacher(payload: CreateTeacherPayload) {
  return apiRequest<AdminTeacher>('/teachers', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminTeacher(teacherId: string, payload: UpdateTeacherPayload) {
  return apiRequest<AdminTeacher>(`/teachers/${teacherId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteAdminTeacher(teacherId: string) {
  return apiRequest<null>(`/teachers/${teacherId}`, {
    method: 'DELETE',
  });
}

export function fetchAssignableCourses(teacherId: string) {
  return apiRequest<AdminTeacherCourse[]>(
    `/admin/teachers/${teacherId}/assignable-courses`,
  );
}

export function assignTeacherCourses(teacherId: string, courseIds: string[]) {
  return apiRequest<AdminTeacherCourse[]>(`/admin/teachers/${teacherId}/courses`, {
    method: 'PUT',
    body: { course_ids: courseIds },
  });
}

export function fetchAssignableLiveClasses(teacherId: string) {
  return apiRequest<AdminTeacherLiveClass[]>(
    `/admin/teachers/${teacherId}/assignable-live-classes`,
  );
}

export function assignTeacherLiveClasses(teacherId: string, liveClassIds: string[]) {
  return apiRequest<AdminTeacherLiveClass[]>(
    `/admin/teachers/${teacherId}/live-classes`,
    {
      method: 'PUT',
      body: { live_class_ids: liveClassIds },
    },
  );
}
