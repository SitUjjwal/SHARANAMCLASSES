/**
 * Express Request augmentation for authenticated + course-gated routes.
 * After `requireAuth`, handlers can read `req.user` and `req.accessToken`.
 * After course-access middleware, handlers can read `req.courseAccess`.
 * After requirePermission / requireAdmin / requireStaff, handlers can read `req.staff`.
 */
import type { User } from '@supabase/supabase-js';

import type { CourseAccessContext } from '../services/courseAccess.service';
import type { StaffContext } from '../services/role.service';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      accessToken?: string;
      /** Correlation id from requestId middleware */
      requestId?: string;
      /** Set by attachCourseAccessFromCourse / attachCourseAccessFromChapter */
      courseAccess?: CourseAccessContext;
      /** Set by requirePermission / requireAdmin / requireStaff */
      staff?: StaffContext;
    }
  }
}

export {};
