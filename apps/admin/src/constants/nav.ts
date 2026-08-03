/**
 * Admin primary sidebar — flat menu (RBAC-gated).
 * Secondary tools remain routable but are not listed here.
 */
import type { AdminPermission } from '@sharanam/shared';

export type AdminNavItem = {
  label: string;
  path: string;
  description: string;
  permission: AdminPermission;
};

/** Primary sidebar order (Logout is rendered separately). */
export const ADMIN_NAV: AdminNavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    description: 'Overview of courses, students, and payments.',
    permission: 'dashboard:read',
  },
  {
    label: 'Students',
    path: '/students',
    description: 'Student profiles, class, medium, and enrollments.',
    permission: 'students:read',
  },
  {
    label: 'Teachers',
    path: '/teachers',
    description: 'Instructor profiles linked to courses.',
    permission: 'teachers:read',
  },
  {
    label: 'Courses',
    path: '/courses',
    description: 'Create and publish course catalog.',
    permission: 'courses:read',
  },
  {
    label: 'Live Classes',
    path: '/live-classes',
    description: 'Schedule YouTube Live sessions and notify students.',
    permission: 'courses:read',
  },
  {
    label: 'Tests',
    path: '/tests',
    description: 'Chapter, subject, mock, previous-year, and daily quizzes.',
    permission: 'tests:read',
  },
  {
    label: 'Payments',
    path: '/payments',
    description: 'Orders, refunds, and Razorpay status.',
    permission: 'payments:read',
  },
  {
    label: 'Analytics',
    path: '/analytics',
    description: 'Engagement, revenue, and learning insights.',
    permission: 'analytics:read',
  },
  {
    label: 'Reports',
    path: '/reports',
    description: 'Operational report links and CSV exports.',
    permission: 'reports:read',
  },
  {
    label: 'Notifications',
    path: '/notifications',
    description: 'Compose and send push campaigns to students.',
    permission: 'communications:read',
  },
  {
    label: 'Feedback',
    path: '/feedback',
    description: 'Support tickets and student feedback.',
    permission: 'feedback:read',
  },
  {
    label: 'Support',
    path: '/support-chat',
    description: 'Live chat with students.',
    permission: 'feedback:read',
  },
  {
    label: 'Activity Logs',
    path: '/activity-logs',
    description: 'Audit trail of admin actions.',
    permission: 'settings:read',
  },
  {
    label: 'Settings',
    path: '/settings',
    description: 'Branding, legal, version, and maintenance mode.',
    permission: 'settings:read',
  },
];
