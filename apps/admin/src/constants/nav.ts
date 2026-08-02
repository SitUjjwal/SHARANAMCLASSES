/**
 * Admin navigation — sidebar + Dashboard tiles.
 * Grouped sections; Feedback & Support cluster matches product menu.
 */
export type AdminNavSection =
  | 'main'
  | 'feedback'
  | 'comms'
  | 'catalog'
  | 'tests'
  | 'people'
  | 'billing';

export type AdminNavItem = {
  label: string;
  path: string;
  /** Short description shown on Dashboard tiles */
  description: string;
  section: AdminNavSection;
};

export const ADMIN_NAV_SECTION_LABELS: Record<AdminNavSection, string> = {
  main: '',
  feedback: 'Feedback & Support',
  comms: 'Communications',
  catalog: 'Catalog',
  tests: 'Tests & Insights',
  people: 'People',
  billing: 'Billing',
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    description: 'Overview of courses, students, and payments.',
    section: 'main',
  },
  {
    label: 'Reviews',
    path: '/reviews',
    description: 'Approve or reject student course ratings.',
    section: 'feedback',
  },
  {
    label: 'Feedback',
    path: '/feedback',
    description: 'Support tickets: general, course, teacher, suggestion, complaint.',
    section: 'feedback',
  },
  {
    label: 'Support',
    path: '/support-chat',
    description: 'Live chat with students and typing indicators.',
    section: 'feedback',
  },
  {
    label: 'Bug Reports',
    path: '/bug-reports',
    description: 'App bugs with screen + optional screenshot.',
    section: 'feedback',
  },
  {
    label: 'FAQs',
    path: '/faqs',
    description: 'Create, edit, delete, and sort student help FAQs.',
    section: 'feedback',
  },
  {
    label: 'Content Reports',
    path: '/content-reports',
    description: 'Incorrect video/PDF, broken links, bad questions.',
    section: 'feedback',
  },
  {
    label: 'Testimonials',
    path: '/testimonials',
    description: 'Feature approved reviews on marketing surfaces.',
    section: 'feedback',
  },
  {
    label: 'Notifications',
    path: '/notifications',
    description: 'Compose and send push campaigns to students.',
    section: 'comms',
  },
  {
    label: 'Announcements',
    path: '/announcements',
    description: 'Home notices: rich text, image, schedule, pin.',
    section: 'comms',
  },
  {
    label: 'Banners',
    path: '/banners',
    description: 'Home banner slider images and redirects.',
    section: 'comms',
  },
  {
    label: 'Reminder Engine',
    path: '/reminder-engine',
    description: 'Scheduled jobs: live, tests, expiry, chapters, missed.',
    section: 'comms',
  },
  {
    label: 'Delivery Reports',
    path: '/delivery-reports',
    description: 'Delivery stats, search, filters, and CSV export.',
    section: 'comms',
  },
  {
    label: 'Certificates',
    path: '/certificates',
    description: 'Approve course-completion certificates and PDFs.',
    section: 'comms',
  },
  {
    label: 'Feedback Hub',
    path: '/feedback-dashboard',
    description: 'Unified inbox: analytics, search, filter, CSV export.',
    section: 'comms',
  },
  {
    label: 'Courses',
    path: '/courses',
    description: 'Create and publish course catalog.',
    section: 'catalog',
  },
  {
    label: 'Categories',
    path: '/categories',
    description: 'Manage subject categories and icons.',
    section: 'catalog',
  },
  {
    label: 'Chapters',
    path: '/chapters',
    description: 'Syllabus, videos, PDFs, and notes.',
    section: 'catalog',
  },
  {
    label: 'Videos',
    path: '/videos',
    description: 'YouTube videos assigned to course chapters.',
    section: 'catalog',
  },
  {
    label: 'PDFs',
    path: '/pdfs',
    description: 'Upload PDFs to R2 and assign to chapters.',
    section: 'catalog',
  },
  {
    label: 'Notes',
    path: '/notes',
    description: 'Paste HTTPS notes links assigned to chapters.',
    section: 'catalog',
  },
  {
    label: 'Live Classes',
    path: '/live-classes',
    description: 'Schedule YouTube Live sessions and notify students.',
    section: 'catalog',
  },
  {
    label: 'Tests',
    path: '/tests',
    description: 'Chapter, subject, mock, previous-year, and daily quizzes.',
    section: 'tests',
  },
  {
    label: 'Questions',
    path: '/questions',
    description: 'Open a test question bank (MCQ + Excel import).',
    section: 'tests',
  },
  {
    label: 'Results',
    path: '/results',
    description: 'Scored attempts across students.',
    section: 'tests',
  },
  {
    label: 'Leaderboard',
    path: '/leaderboard',
    description: 'Top 100 ranks by score and time.',
    section: 'tests',
  },
  {
    label: 'Analytics',
    path: '/analytics',
    description: 'Average score, pass rate, strong/weak subjects.',
    section: 'tests',
  },
  {
    label: 'Teachers',
    path: '/teachers',
    description: 'Instructor profiles linked to courses.',
    section: 'people',
  },
  {
    label: 'Students',
    path: '/students',
    description: 'Student profiles, class, medium, and enrollments.',
    section: 'people',
  },
  {
    label: 'Payments',
    path: '/payments',
    description: 'Orders, refunds, and Razorpay status.',
    section: 'billing',
  },
];
