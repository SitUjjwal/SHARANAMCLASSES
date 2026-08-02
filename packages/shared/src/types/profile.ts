/**
 * Student profile / certificates / achievements / learning progress.
 */
export type StudentProfile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  class_level: string;
  medium: string;
  avatar_url: string | null;
  avatar_storage_key: string | null;
  created_at: string;
  updated_at: string;
};

export type UpdateStudentProfileInput = {
  full_name?: string;
  phone_number?: string;
  class_level?: string;
  medium?: 'hindi' | 'english';
  avatar_url?: string | null;
  avatar_storage_key?: string | null;
};

/** Result of POST /profile/avatar (binary → R2; DB updated separately via PATCH) */
export type ProfileAvatarUploadResult = {
  avatar_url: string;
  avatar_storage_key: string;
};

export type StudentProfileStats = {
  purchased_courses: number;
  total_tests: number;
  average_score: number;
};

/** Profile hub payload — profile + engagement stats */
export type StudentProfileOverview = {
  profile: StudentProfile;
  stats: StudentProfileStats;
};

export type CertificateStatus = 'pending_approval' | 'issued' | 'rejected';

export type Certificate = {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  description: string;
  certificate_number: string | null;
  status: CertificateStatus;
  student_name: string;
  certificate_url: string | null;
  storage_key: string | null;
  issued_at: string | null;
  requested_at: string;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  course_title?: string | null;
};

export type AdminCertificate = Certificate & {
  student_email?: string | null;
};

export type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string | null;
  sort_order: number;
  unlocked: boolean;
  unlocked_at: string | null;
};

export type LearningProgressCourse = {
  course_id: string;
  title: string;
  thumbnail_url: string | null;
  /** 0–100 for this course (completed_chapters / total_chapters) */
  progress_percent: number;
  total_chapters: number;
  completed_chapters: number;
  remaining_chapters: number;
  last_watched_at: string | null;
  last_watched_chapter_id: string | null;
  last_watched_chapter_title: string | null;
  last_watched_video_title: string | null;
};

export type LearningProgressContinue = {
  course_id: string;
  course_title: string;
  chapter_id: string;
  chapter_title: string;
  video_title: string | null;
  last_watched_at: string;
};

export type LearningProgressLastVideo = {
  title: string;
  course_title: string;
  chapter_title: string;
  course_id: string;
  chapter_id: string;
  watched_at: string;
};

export type LearningProgressSummary = {
  /** Sum of completed chapters across enrolled courses */
  completed_chapters: number;
  /** Sum of remaining chapters across enrolled courses */
  remaining_chapters: number;
  /**
   * overall = round(100 × completed_chapters / total_chapters)
   * (0 when no published chapters)
   */
  overall_percentage: number;
  enrolled_courses: number;
  completed_courses: number;
  /** Alias of overall_percentage (legacy field) */
  average_progress: number;
  continue_learning: LearningProgressContinue | null;
  last_watched_video: LearningProgressLastVideo | null;
  courses: LearningProgressCourse[];
};
