/**
 * Admin teacher directory API.
 */
import { apiRequest } from '@/services/api';

export type TeacherRecord = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
};

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
  return apiRequest<TeacherRecord[]>('/admin/teachers');
}

export function createAdminTeacher(payload: CreateTeacherPayload) {
  return apiRequest<TeacherRecord>('/admin/teachers', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminTeacher(teacherId: string, payload: UpdateTeacherPayload) {
  return apiRequest<TeacherRecord>(`/admin/teachers/${teacherId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteAdminTeacher(teacherId: string) {
  return apiRequest<null>(`/admin/teachers/${teacherId}`, {
    method: 'DELETE',
  });
}
