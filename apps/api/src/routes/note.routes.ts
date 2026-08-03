/**
 * Notes REST routes (admin).
 *
 *   GET|POST          /notes
 *   GET|PUT|DELETE    /notes/:id
 */
import { Router } from 'express';

import {
  getNote,
  listNotes,
  postNote,
  putNote,
  removeNote,
} from '../controllers/note.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';
import {
  createNoteSchema,
  listNotesQuerySchema,
  updateNoteSchema,
} from '../validators/note.validators';

export const noteRouter = Router();

noteRouter.get(
  '/notes',
  requireAuth,
  requirePermission('courses:read'),
  validate(listNotesQuerySchema, 'query'),
  listNotes,
);

noteRouter.post('/notes', requireAuth, requirePermission('courses:create'), validate(createNoteSchema), postNote);

noteRouter.get('/notes/:id', requireAuth, requirePermission('courses:read'), getNote);

noteRouter.put(
  '/notes/:id',
  requireAuth,
  requirePermission('courses:update'),
  validate(updateNoteSchema),
  putNote,
);

noteRouter.delete('/notes/:id', requireAuth, requirePermission('courses:delete'), removeNote);
