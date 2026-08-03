/**
 * Admin teacher management shared types.
 */

export type AdminTeacher = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  course_count: number;
  live_class_count: number;
  created_at?: string;
};

export type AdminTeacherStats = {
  teacher_id: string;
  courses_assigned: number;
  courses_published: number;
  live_classes_assigned: number;
  live_classes_upcoming: number;
  live_classes_today: number;
  total_enrollments: number;
  feedback_count: number;
};

export type AdminTeacherCourse = {
  id: string;
  title: string;
  is_published: boolean;
  teacher_id: string | null;
  teacher_name: string | null;
  enrollment_count: number;
};

export type AdminTeacherLiveClass = {
  id: string;
  title: string;
  course_id: string | null;
  course_title: string | null;
  start_time: string;
  end_time: string;
  is_published: boolean;
  teacher_id: string | null;
};

export type AdminTeacherDetail = {
  teacher: AdminTeacher;
  stats: AdminTeacherStats;
  courses: AdminTeacherCourse[];
  live_classes: AdminTeacherLiveClass[];
};

export type AssignTeacherCoursesInput = {
  course_ids: string[];
};

export type AssignTeacherLiveClassesInput = {
  live_class_ids: string[];
};
