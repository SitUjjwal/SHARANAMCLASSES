/**
 * Admin certificates API.
 */
import type { AdminCertificate, Certificate, CertificateStatus } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type AdminStudentOption = {
  id: string;
  full_name: string;
  email: string;
  class_level: string;
};

export async function listAdminCertificates(
  status?: CertificateStatus,
): Promise<AdminCertificate[]> {
  return apiRequest<AdminCertificate[]>('/admin/certificates', {
    params: status ? { status } : undefined,
  });
}

export async function searchCertificateStudents(
  q = '',
  limit = 20,
): Promise<AdminStudentOption[]> {
  return apiRequest<AdminStudentOption[]>('/admin/certificates/students', {
    params: { q, limit },
  });
}

export async function createAdminCertificate(body: {
  user_id: string;
  course_id?: string | null;
  student_name?: string;
  course_title?: string;
  description?: string;
  issue_now?: boolean;
}): Promise<Certificate> {
  return apiRequest<Certificate>('/admin/certificates', {
    method: 'POST',
    body,
  });
}

export async function approveCertificate(certificateId: string): Promise<Certificate> {
  return apiRequest<Certificate>(`/admin/certificates/${certificateId}/approve`, {
    method: 'POST',
  });
}

export async function rejectCertificate(
  certificateId: string,
  reason?: string,
): Promise<Certificate> {
  return apiRequest<Certificate>(`/admin/certificates/${certificateId}/reject`, {
    method: 'POST',
    body: { reason },
  });
}

export async function updateAdminCertificate(
  certificateId: string,
  body: {
    student_name?: string;
    course_title?: string;
    description?: string;
    regenerate_pdf?: boolean;
  },
): Promise<Certificate> {
  return apiRequest<Certificate>(`/admin/certificates/${certificateId}`, {
    method: 'PATCH',
    body,
  });
}
