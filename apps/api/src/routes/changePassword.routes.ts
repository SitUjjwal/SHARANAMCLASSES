/**
 * Auth-adjacent routes used by the student profile module.
 *
 * PUT /change-password
 */
import { Router } from 'express';

import { changePassword } from '../controllers/changePassword.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { changePasswordSchema } from '../validators/changePassword.validators';

export const changePasswordRouter = Router();

changePasswordRouter.put(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  changePassword,
);
