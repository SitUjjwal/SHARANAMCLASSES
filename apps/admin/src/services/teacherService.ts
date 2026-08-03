/**
 * teacherService — thin wrapper around teachers admin API.
 */
export {
  assignTeacherCourses,
  assignTeacherLiveClasses,
  createAdminTeacher as createTeacher,
  deleteAdminTeacher as deleteTeacher,
  fetchAdminTeacherDetail,
  fetchAdminTeachers as listTeachers,
  fetchAssignableCourses,
  fetchAssignableLiveClasses,
  updateAdminTeacher as updateTeacher,
} from '@/features/teachers/api';
