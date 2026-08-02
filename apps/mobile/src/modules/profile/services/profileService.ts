/**
 * Profile module services — API wrappers for profile hub screens.
 */
import type {
  Achievement,
  ApiSuccessResponse,
  Certificate,
  LearningProgressSummary,
  ProfileAvatarUploadResult,
  StudentProfile,
  StudentProfileOverview,
  UpdateStudentProfileInput,
} from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function fetchProfile(): Promise<StudentProfile> {
  const { data } = await apiClient.get<ApiSuccessResponse<StudentProfile>>('/profile');
  return data.data;
}

/** Profile hub: identity fields + purchased courses / tests / average score */
export async function fetchProfileOverview(): Promise<StudentProfileOverview> {
  const { data } = await apiClient.get<ApiSuccessResponse<StudentProfileOverview>>(
    '/profile/overview',
  );
  return data.data;
}

export async function updateProfile(
  input: UpdateStudentProfileInput,
): Promise<StudentProfile> {
  const { data } = await apiClient.put<ApiSuccessResponse<StudentProfile>>(
    '/profile',
    input,
  );
  return data.data;
}

/**
 * uploadProfileAvatar
 * Multipart → POST /profile/upload-photo → R2 public URL + storage key.
 */
export async function uploadProfileAvatar(input: {
  uri: string;
  mimeType: string;
  fileName?: string;
}): Promise<ProfileAvatarUploadResult> {
  const ext =
    input.mimeType === 'image/png'
      ? 'png'
      : input.mimeType === 'image/webp'
        ? 'webp'
        : 'jpg';
  const fileName = input.fileName ?? `avatar.${ext}`;

  const formData = new FormData();
  formData.append('image', {
    uri: input.uri,
    name: fileName,
    type: input.mimeType,
  } as unknown as Blob);

  const { data } = await apiClient.post<ApiSuccessResponse<ProfileAvatarUploadResult>>(
    '/profile/upload-photo',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    },
  );
  return data.data;
}

export async function fetchLearningProgress(): Promise<LearningProgressSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<LearningProgressSummary>>(
    '/progress',
  );
  return data.data;
}

export async function fetchCertificates(): Promise<Certificate[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Certificate[]>>('/certificates');
  return data.data;
}

export async function fetchCertificate(certificateId: string): Promise<Certificate> {
  const { data } = await apiClient.get<ApiSuccessResponse<Certificate>>(
    `/certificates/${certificateId}`,
  );
  return data.data;
}

export async function requestCertificate(courseId: string): Promise<Certificate> {
  const { data } = await apiClient.post<ApiSuccessResponse<Certificate>>(
    '/certificates/request',
    { course_id: courseId },
  );
  return data.data;
}

export async function fetchAchievements(): Promise<Achievement[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Achievement[]>>('/achievements');
  return data.data;
}
