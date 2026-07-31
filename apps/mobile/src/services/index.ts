export {
  registerWithEmail,
  loginWithEmail,
  sendPasswordReset,
  logout,
  getCurrentSession,
} from './auth.service';
export type { RegisterResult, LoginResult } from './auth.service';
export { insertStudentProfile } from './profile.service';
export { getHealth } from './health.service';
export type { HealthResponse } from './health.service';
export { fetchDashboard } from './dashboard.service';
export { fetchCoursesPage, fetchCourseDetail, enrollInCourse } from './course.service';
export type { FetchCoursesParams } from './course.service';
export { fetchChapters, fetchChapterDetail } from './chapter.service';
export { fetchBanners } from './banner.service';
export { fetchCategories } from './category.service';
export type { FetchCategoriesParams } from './category.service';
