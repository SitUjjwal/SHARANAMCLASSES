/**
 * Express Request augmentation for authenticated + course-gated routes.
 * After `requireAuth`, handlers can read `req.user` and `req.accessToken`.
 * After course-access middleware, handlers can read `req.courseAccess`.
 */
import type { User } from '@supabase/supabase-js';

import type { CourseAccessContext } from '../services/courseAccess.service';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      accessToken?: string;
      /** Set by attachCourseAccessFromCourse / attachCourseAccessFromChapter */
      courseAccess?: CourseAccessContext;
    }
  }
}

export {};
