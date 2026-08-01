/**
 * Admin navigation menu — single source for sidebar + Dashboard tiles.
 *
 * Primary Test Series cluster first (per product menu), then catalog ops.
 */
export type AdminNavItem = {
  label: string;
  path: string;
  /** Short description shown on Dashboard tiles */
  description: string;
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    description: 'Overview of courses, students, and payments.',
  },
  {
    label: 'Courses',
    path: '/courses',
    description: 'Create and publish course catalog.',
  },
  {
    label: 'Tests',
    path: '/tests',
    description: 'Chapter, subject, mock, previous-year, and daily quizzes.',
  },
  {
    label: 'Questions',
    path: '/questions',
    description: 'Open a test question bank (MCQ + Excel import).',
  },
  {
    label: 'Results',
    path: '/results',
    description: 'Scored attempts across students.',
  },
  {
    label: 'Leaderboard',
    path: '/leaderboard',
    description: 'Top 100 ranks by score and time.',
  },
  {
    label: 'Analytics',
    path: '/analytics',
    description: 'Average score, pass rate, strong/weak subjects.',
  },
  {
    label: 'Banners',
    path: '/banners',
    description: 'Home banner slider images (max 20).',
  },
  {
    label: 'Categories',
    path: '/categories',
    description: 'Manage subject categories and icons.',
  },
  {
    label: 'Chapters',
    path: '/chapters',
    description: 'Syllabus, videos, PDFs, and notes.',
  },
  {
    label: 'Videos',
    path: '/videos',
    description: 'YouTube videos assigned to course chapters.',
  },
  {
    label: 'PDFs',
    path: '/pdfs',
    description: 'Upload PDFs to R2 and assign to chapters.',
  },
  {
    label: 'Notes',
    path: '/notes',
    description: 'Paste HTTPS notes links assigned to chapters.',
  },
  {
    label: 'Live Classes',
    path: '/live-classes',
    description: 'Schedule YouTube Live sessions and notify students.',
  },
  {
    label: 'Teachers',
    path: '/teachers',
    description: 'Instructor profiles linked to courses.',
  },
  {
    label: 'Students',
    path: '/students',
    description: 'Student accounts and enrollments.',
  },
  {
    label: 'Payments',
    path: '/payments',
    description: 'Orders, refunds, and Razorpay status.',
  },
];
