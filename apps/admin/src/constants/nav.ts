/**
 * Admin navigation — full sidebar + Dashboard tiles.
 * Grouped sections; each item gated by RBAC.
 */
import type { AdminPermission } from '@sharanam/shared';

export type AdminNavSection =
  | 'main'
  | 'catalog'
  | 'tests'
  | 'people'
  | 'comms'
  | 'feedback'
  | 'billing'
  | 'ops';

export type AdminNavItem = {
  label: string;
  path: string;
  description: string;
  section: AdminNavSection;
  permission: AdminPermission;
};

export const ADMIN_NAV_SECTION_LABELS: Record<AdminNavSection, string> = {
  main: '',
  catalog: 'Catalog',
  tests: 'Tests & Insights',
  people: 'People',
  comms: 'Communications',
  feedback: 'Feedback & Support',
  billing: 'Billing',
  ops: 'Operations',
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    description: 'Overview of courses, students, and payments.',
    section: 'main',
    permission: 'dashboard:read',
  },

  // Catalog
  {
    label: 'Batches',
    path: '/batches',
    description: 'Batch → Subject → Chapter management.',
    section: 'catalog',
    permission: 'courses:read',
  },
  {
    label: 'Courses',
    path: '/courses',
    description: 'Create and publish course catalog.',
    section: 'catalog',
    permission: 'courses:read',
  },
  {
    label: 'Categories',
    path: '/categories',
    description: 'Manage subject categories and icons.',
    section: 'catalog',
    permission: 'courses:read',
  },
  {
    label: 'Chapters',
    path: '/chapters',
    description: 'Syllabus order, videos, PDFs, and notes.',
    section: 'catalog',
    permission: 'courses:read',
  },
  {
    label: 'Videos',
    path: '/videos',
    description: 'Chapter video catalog and metadata.',
    section: 'catalog',
    permission: 'courses:read',
  },
  {
    label: 'PDFs',
    path: '/pdfs',
    description: 'Upload and manage chapter PDFs.',
    section: 'catalog',
    permission: 'courses:read',
  },
  {
    label: 'Notes',
    path: '/notes',
    description: 'Text notes attached to chapters.',
    section: 'catalog',
    permission: 'courses:read',
  },
  {
    label: 'Live Classes',
    path: '/live-classes',
    description: 'Schedule YouTube Live sessions.',
    section: 'catalog',
    permission: 'courses:read',
  },
  {
    label: 'Certificates',
    path: '/certificates',
    description: 'Issue and manage student certificates.',
    section: 'catalog',
    permission: 'courses:read',
  },

  // Tests
  {
    label: 'Tests',
    path: '/tests',
    description: 'Chapter, subject, mock, and daily quizzes.',
    section: 'tests',
    permission: 'tests:read',
  },
  {
    label: 'Questions',
    path: '/questions',
    description: 'Question bank and test linking.',
    section: 'tests',
    permission: 'tests:read',
  },
  {
    label: 'Results',
    path: '/results',
    description: 'Attempt results and scoring.',
    section: 'tests',
    permission: 'tests:read',
  },
  {
    label: 'Leaderboard',
    path: '/leaderboard',
    description: 'Rankings across tests.',
    section: 'tests',
    permission: 'tests:read',
  },
  {
    label: 'Analytics',
    path: '/analytics',
    description: 'Engagement, revenue, and learning insights.',
    section: 'tests',
    permission: 'analytics:read',
  },

  // People
  {
    label: 'Students',
    path: '/students',
    description: 'Student profiles, class, medium, enrollments.',
    section: 'people',
    permission: 'students:read',
  },
  {
    label: 'Teachers',
    path: '/teachers',
    description: 'Instructor profiles linked to courses.',
    section: 'people',
    permission: 'teachers:read',
  },
  {
    label: 'Roles & Access',
    path: '/roles',
    description: 'Assign staff roles and view permission matrix.',
    section: 'people',
    permission: 'roles:read',
  },

  // Communications
  {
    label: 'Notifications',
    path: '/notifications',
    description: 'Compose and send push campaigns.',
    section: 'comms',
    permission: 'communications:read',
  },
  {
    label: 'Announcements',
    path: '/announcements',
    description: 'Home notices: schedule and pin.',
    section: 'comms',
    permission: 'communications:read',
  },
  {
    label: 'Banners',
    path: '/banners',
    description: 'Home carousel banners and redirects.',
    section: 'comms',
    permission: 'communications:read',
  },
  {
    label: 'Reminder Engine',
    path: '/reminder-engine',
    description: 'Automated reminder rules.',
    section: 'comms',
    permission: 'communications:read',
  },
  {
    label: 'Delivery Reports',
    path: '/delivery-reports',
    description: 'Push delivery stats.',
    section: 'comms',
    permission: 'communications:read',
  },

  // Feedback
  {
    label: 'Feedback',
    path: '/feedback',
    description: 'Support tickets and student feedback.',
    section: 'feedback',
    permission: 'feedback:read',
  },
  {
    label: 'Support Chat',
    path: '/support-chat',
    description: 'Live chat with students.',
    section: 'feedback',
    permission: 'feedback:read',
  },
  {
    label: 'Reviews',
    path: '/reviews',
    description: 'Moderate course reviews.',
    section: 'feedback',
    permission: 'feedback:read',
  },
  {
    label: 'Testimonials',
    path: '/testimonials',
    description: 'Featured approved reviews.',
    section: 'feedback',
    permission: 'feedback:read',
  },
  {
    label: 'Bug Reports',
    path: '/bug-reports',
    description: 'App bug reports from students.',
    section: 'feedback',
    permission: 'feedback:read',
  },
  {
    label: 'Content Reports',
    path: '/content-reports',
    description: 'Wrong PDF / video / question flags.',
    section: 'feedback',
    permission: 'feedback:read',
  },
  {
    label: 'FAQs',
    path: '/faqs',
    description: 'Help center FAQ entries.',
    section: 'feedback',
    permission: 'feedback:read',
  },

  // Billing
  {
    label: 'Payments',
    path: '/payments',
    description: 'Orders, refunds, and Razorpay status.',
    section: 'billing',
    permission: 'payments:read',
  },
  {
    label: 'Revenue',
    path: '/revenue',
    description: 'Revenue breakdown and trends.',
    section: 'billing',
    permission: 'payments:read',
  },
  {
    label: 'Reports',
    path: '/reports',
    description: 'Operational report links and CSV exports.',
    section: 'billing',
    permission: 'reports:read',
  },

  // Ops
  {
    label: 'Activity Logs',
    path: '/activity-logs',
    description: 'Audit trail of admin actions.',
    section: 'ops',
    permission: 'settings:read',
  },
  {
    label: 'Monitoring',
    path: '/monitoring',
    description: 'API, database, memory, CPU, and failure metrics.',
    section: 'ops',
    permission: 'settings:read',
  },
  {
    label: 'Backups',
    path: '/backups',
    description: 'Database, R2 metadata, and settings backups.',
    section: 'ops',
    permission: 'settings:read',
  },
  {
    label: 'App versions',
    path: '/versions',
    description: 'SemVer releases, force/optional updates, build numbers, history.',
    section: 'ops',
    permission: 'settings:read',
  },
  {
    label: 'Settings',
    path: '/settings',
    description: 'Branding, social links, legal, maintenance.',
    section: 'ops',
    permission: 'settings:read',
  },
];

export const ADMIN_NAV_SECTION_ORDER: AdminNavSection[] = [
  'main',
  'catalog',
  'tests',
  'people',
  'comms',
  'feedback',
  'billing',
  'ops',
];
